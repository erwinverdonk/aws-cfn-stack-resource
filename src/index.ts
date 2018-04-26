import { AwsCfnWait} from '@erwinverdonk/aws-cfn-wait';
import { Stack } from './lib/stack';

type Callback = (error?:any, result?:any) => void;

export const handler = (event:any, context:any, callback: Callback) => {
	AwsCfnWait.create({ CustomResource: Stack, event, context, callback })
};
