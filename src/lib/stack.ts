import * as AWS from 'aws-sdk';
import { CloudFormation, Lambda, Credentials } from 'aws-sdk';

type StackProperties = {
  StackName: string,
  TemplateBody: string
}

type ResourceProperties = {
  AssumeRoleArn: AWS.STS.arnType,
  Stack: StackProperties,
  Region: string
}

type WaitResult = {
  shouldWait: boolean,
  status?: string,
  context?: any,
  error?: {
    message: string
  },
  result?: any
}

export const Stack = {
  /**
   * Creates a new instance of Stack
   */
  create: (event:any, context:any) => {
    // Translates CloudFormation outputs to regular JSON object
    const outputsExtractor = (outputs:CloudFormation.Outputs) => {
      return outputs.reduce((acc:any, output:any) => {
        acc[output.OutputKey] = output.OutputValue;
        return acc;
      }, {});
    };

    // Retrieves stack description
    const describeStack = (cfn:CloudFormation, stackProps:StackProperties) => () => {
      return cfn.describeStacks({StackName: stackProps.StackName}).promise()
        .then(_ => _.Stacks[0])
        .then(_ => {
          console.log('Stack Description:', JSON.stringify(_));
          return _;
        });
    };

    // Retrieves stack events and throw it together with provided error.
    const describeStackEventsAndHandleError = (cfn:CloudFormation, stackProps:StackProperties) => (error:any) => {
      return cfn.describeStackEvents({
        StackName: stackProps.StackName
      }).promise()
        .then(_ => {
          throw new Error(JSON.stringify({
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            stackEvents: _.StackEvents
          }));
        });
    };

    // Creates the stack
    const createStack = (cfn:CloudFormation, stackProps:StackProperties) => () => {
      console.log('Create stack from template:', JSON.stringify(stackProps));

      return cfn.createStack(stackProps).promise()
        .then(describeStack(cfn, stackProps))
        // Return the output variables + PhysicalResourceId for CloudFormation
        // to identify this stack correctly.
        .then(stack => ({
          ...outputsExtractor(stack.Outputs),
          PhysicalResourceId: stack.StackId
        }))
        .catch(describeStackEventsAndHandleError(cfn, stackProps));
    };

    // Updates the stack
    const updateStack = (cfn:CloudFormation, stackProps:StackProperties) => () => {
      console.log('Update stack with template:', JSON.stringify(stackProps));

      // TODO: When stack name has changed, we need to remove and create.
      // Currently the stack will fail because it cannot find the new stack
      // name to update.

      return cfn.updateStack(stackProps as CloudFormation.UpdateStackInput).promise()
        .then(describeStack(cfn, stackProps))
        // Return the output variables + PhysicalResourceId for CloudFormation
        // to identify this stack correctly.
        .then(stack => ({
          ...outputsExtractor(stack.Outputs),
          PhysicalResourceId: stack.StackId
        }))
        .catch(describeStackEventsAndHandleError(cfn, stackProps));
    };

    // Deletes the stack
    const deleteStack = (cfn:CloudFormation, stackProps:StackProperties) => () => {
      console.log('Delete stack with template:', JSON.stringify(stackProps));

      return cfn.deleteStack({StackName: event.PhysicalResourceId }).promise() // stackProps.StackName
        .then(describeStack(cfn, stackProps))
        // Return the output variables + PhysicalResourceId for CloudFormation
        // to identify this stack correctly.
        .then(stack => ({
          ...outputsExtractor(stack.Outputs),
          PhysicalResourceId: stack.StackId
        }))
        .catch(describeStackEventsAndHandleError(cfn, stackProps));
    };

    // Assumes the role provided for the template before create/update/delete the stack
    const assumeRole = (assumeRoleArn:AWS.STS.arnType, sessionName:string) => {
      console.log('Assume Role: ', assumeRoleArn);

      return new AWS.STS().assumeRole({
        RoleArn: assumeRoleArn,
        RoleSessionName: sessionName,
        DurationSeconds: 900 // Minimum allowed is 15 minutes
      })
        .promise()
        .then(result => {
          const creds = result.Credentials;

          return {
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            expiration: creds.Expiration
          };
        });
    };

    /**
     * Retrieves methods to return as export members, with optional
     * credentials object to use.
     */
    const getMethods = (creds?: Credentials) => {
      return {
        // Determines whether to wait for response or not.
        wait: ():Promise<WaitResult> => {
          const props = event.ResourceProperties;
          const waitProps = event.WaitProperties;

          console.log('WaitForComplete');
          console.log('StackName:', props.Stack.StackName);

          // Instantiate CloudFormation
          const cfn = new AWS.CloudFormation({
            region: props.Region,
            credentials: creds
          });

          // Retrieve stack description to check progress
          return cfn.describeStacks({
            StackName: waitProps ? waitProps.responseData.PhysicalResourceId : props.Stack.StackName
          }).promise()
            .then(_ => _.Stacks[0])
            .then(stack => {
              console.log('Stack Status:', stack.StackStatus);

              // Progress statuses for which we want to wait
              if([
                'CREATE_IN_PROGRESS', 
                'UPDATE_IN_PROGRESS', 
                'DELETE_IN_PROGRESS'
              ].includes(stack.StackStatus)){
                return {
                  shouldWait: true,
                  status: stack.StackStatus,
                  context: stack
                };
              } else {
                // Complete statuses
                if([
                  'CREATE_COMPLETE', 
                  'UPDATE_COMPLETE', 
                  'UPDATE_ROLLBACK_COMPLETE', 
                  'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS', 
                  'DELETE_COMPLETE'
                ].includes(stack.StackStatus)){
                  return {
                    shouldWait: false,
                    status: stack.StackStatus,
                    context: stack,
                    result: {
                      ...outputsExtractor(stack.Outputs),
                      PhysicalResourceId: stack.StackId
                    }
                  };
                } 
                // Any other statuses are considered erroneous
                else {
                  throw {
                    shouldWait: false,
                    status: stack.StackStatus,
                    context: stack,
                    error: {
                      message: stack.StackStatusReason || 'Erroneous stack status'
                    }
                  };
                }
              }
            })
            .catch(e => {
              throw {
                shouldWait: false,
                error: {
                  message: JSON.stringify(e, Object.getOwnPropertyNames(e))
                }
              };
            });
        },

        // Regular Custom Resource
        customResource: () => {
          const props:ResourceProperties = event.ResourceProperties;
          const stackProps:StackProperties = props.Stack;

          // Instantiate CloudFormation
          const cfn = new AWS.CloudFormation({
            region: props.Region,
            credentials: creds
          });

          return Promise.resolve({
            create: createStack(cfn, stackProps),
            update: updateStack(cfn, stackProps),
            delete: deleteStack(cfn, stackProps)
          });
        }
      };
    };

    const props:ResourceProperties = event.ResourceProperties;

    // When we have a role to assume we run after assuming
    if(props.AssumeRoleArn){
      return assumeRole(props.AssumeRoleArn, context.invokeid)
        .then(_ => getMethods(new Credentials(_)));
    } else {
      return Promise.resolve(getMethods());
    }
  }
};