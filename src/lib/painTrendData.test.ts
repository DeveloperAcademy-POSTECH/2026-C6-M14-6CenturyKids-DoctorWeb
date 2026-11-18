import test from 'node:test';
import assert from 'node:assert/strict';
import { painTrendData } from './painTrendData.ts';
import type { PainRecord } from '../domain/types.ts';
const day = new Date(2026,10,3);
const record = (hour: number, before: number, after?: number): PainRecord => ({ recordedDate:new Date(2026,10,3,hour), location:[], painBefore:before, painAfter:after });
test('zero follow-up is recorded zero, missing days are gaps',()=>{
 const data=painTrendData([record(8,7,0)],[day,new Date(2026,10,4)]);
 assert.deepEqual(data.map(r=>[r.before,r.after]),[[7,0],[null,null]]);
});
test('the latest event never borrows an earlier follow-up',()=>{
 const data=painTrendData([record(8,7,2),record(21,4)],[day]);
 assert.deepEqual([data[0].before,data[0].after],[4,null]);
});
test('events outside the selected window do not enter the graph',()=>{
 const data=painTrendData([record(8,7,2)],[new Date(2026,10,4)]);
 assert.deepEqual(data.map(r=>[r.before,r.after]),[[null,null]]);
});
