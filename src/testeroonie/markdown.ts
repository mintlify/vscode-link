import{ marked } from 'marked';
import { readFile } from 'fs';

const main = async () => {
  let mdContent = ''; 

  await readFile('./test.md', 'utf8', (err, data) => {
    mdContent = data;
    const html = marked.parse(mdContent);
    console.log(html);
  });  
};

main();
