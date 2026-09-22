import test from 'node:test';import assert from 'node:assert/strict';import { auditHar } from '../src/index.js';
const har=headers=>({log:{entries:[{request:{method:'GET',url:'https://api.test/v1?token=secret'},response:{status:200,headers}}]}});
test('parses standard headers and strips query strings',()=>{const r=auditHar(har([{name:'Deprecation',value:'@1735689600'},{name:'Sunset',value:'Sat, 01 Mar 2025 00:00:00 GMT'},{name:'Link',value:'<https://docs.test/migrate>; rel="deprecation"'}]),{now:new Date('2025-02-15')});assert.equal(r.findings[0].severity,'critical');assert.equal(r.findings[0].url,'https://api.test/v1');assert.equal(r.findings[0].links[0].rel,'deprecation')});
test('flags contradictory dates',()=>{const r=auditHar(har([{name:'Deprecation',value:'@1740787200'},{name:'Sunset',value:'Sat, 01 Feb 2025 00:00:00 GMT'}]));assert.match(r.findings[0].problems[0],/precedes/)});
test('deduplicates repeated captures',()=>{const one=har([{name:'Deprecation',value:'true'}]);one.log.entries.push(structuredClone(one.log.entries[0]));assert.equal(auditHar(one).findingCount,1)});
test('rejects non-HAR JSON',()=>assert.throws(()=>auditHar({}),/not a HAR/));
