import test from 'node:test';
import assert from 'node:assert/strict';
import {reliableDispatch} from '../modules/reliable-dispatch.js';
const request={action:'dispatch',revision:27,event:{type:'next'},operationId:'operation-test-1'};
const offline=()=>Object.assign(new Error('network timeout'),{retryable:true});
test('temporary failures retry the same operation without advancing its revision',async()=>{
 const seen=[];let n=0;
 const result=await reliableDispatch(async data=>{seen.push(data);if(n++<2)throw offline();return {ok:true,state:{revision:28}}},request,async()=>{});
 assert.equal(result.state.revision,28);assert.equal(seen.length,3);for(const value of seen)assert.deepEqual(value,request);
});
test('lost write responses are confirmed by operation id; other clients writes are not mistaken for success',async()=>{
 const success=await reliableDispatch(async data=>{if(data.action==='read')return {state:{revision:29,operations:[{id:request.operationId}]}};throw Object.assign(new Error('conflict'),{code:'CONFLICT'})},request,async()=>{});
 assert.equal(success.state.revision,29);
 await assert.rejects(reliableDispatch(async data=>{if(data.action==='read')return {state:{revision:28,operations:[{id:'someone-else'}]}};throw Object.assign(new Error('conflict'),{code:'CONFLICT'})},request,async()=>{}));
});
test('validation errors do not retry; network failures have a finite retry budget',async()=>{
 let calls=0;await assert.rejects(reliableDispatch(async()=>{calls++;throw new Error('invalid')},request,async()=>{}));assert.equal(calls,1);
 calls=0;await assert.rejects(reliableDispatch(async()=>{calls++;throw offline()},request,async()=>{}));assert.equal(calls,4);
});
