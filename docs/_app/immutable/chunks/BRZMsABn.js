function s(r){return[...["a","b","c","d"].map((e,t)=>({html:r[`answer${e.toUpperCase()}Html`],picture:r[`picture_${e}`],originalIndex:t}))].sort(()=>Math.random()-.5)}export{s as getShuffledAnswers};
