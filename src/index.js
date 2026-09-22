function headersOf(entry){const map=new Map();for(const h of entry?.response?.headers||[]){const k=String(h.name).toLowerCase(),a=map.get(k)||[];a.push(String(h.value));map.set(k,a)}return map}
function safeUrl(raw,includeQuery){try{const u=new URL(raw);if(!includeQuery){u.search='';u.hash=''}return u.toString()}catch{return raw}}
function depDate(value){const m=String(value||'').trim().match(/^@(\d+)$/);return m?new Date(Number(m[1])*1000):null}
function iso(date){return date&&Number.isFinite(date.getTime())?date.toISOString():null}
function linkInfo(values){const out=[];for(const value of values||[])for(const part of value.split(/,(?=\s*<)/)){const m=part.match(/<([^>]+)>/),rel=part.match(/;\s*rel=(?:"([^"]+)"|([^;\s]+))/i);if(m&&rel)for(const r of (rel[1]||rel[2]).split(/\s+/))if(['deprecation','sunset','successor-version'].includes(r))out.push({rel:r,url:m[1]})}return out}

export function auditHar(har,{now=new Date(),includeQuery=false}={}){
  const entries=har?.log?.entries;if(!Array.isArray(entries))throw new Error('not a HAR document: log.entries is missing');
  const findings=[],seen=new Set();
  for(const entry of entries){const h=headersOf(entry),dep=h.get('deprecation')?.at(-1),sun=h.get('sunset')?.at(-1),links=linkInfo(h.get('link'));if(!dep&&!sun&&!links.length)continue;
    const url=safeUrl(entry?.request?.url||'',includeQuery),deprecationAt=iso(depDate(dep)),sunsetAt=iso(sun?new Date(sun):null),key=JSON.stringify([entry?.request?.method,url,dep,sun,links]);if(seen.has(key))continue;seen.add(key);
    const sunsetMs=sunsetAt?Date.parse(sunsetAt):null,days=sunsetMs===null?null:Math.ceil((sunsetMs-now.getTime())/86400000);let severity='notice';if(days!==null)severity=days<0?'expired':days<=30?'critical':days<=90?'warning':'notice';
    const problems=[];if(dep&&!deprecationAt&&dep!=='true'&&dep!=='?1')problems.push('invalid Deprecation value');if(sun&&!sunsetAt)problems.push('invalid Sunset HTTP-date');if(deprecationAt&&sunsetAt&&Date.parse(sunsetAt)<Date.parse(deprecationAt))problems.push('Sunset precedes Deprecation');
    findings.push({method:entry?.request?.method||'',url,status:entry?.response?.status,deprecation:dep||null,deprecationAt,sunset:sun||null,sunsetAt,daysUntilSunset:days,severity,links,problems});
  }
  const counts=Object.fromEntries(['expired','critical','warning','notice'].map(x=>[x,findings.filter(f=>f.severity===x).length]));return {entryCount:entries.length,findingCount:findings.length,counts,findings};
}
