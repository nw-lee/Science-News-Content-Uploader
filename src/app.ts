import sources from './source/index';
import { PrismaClient } from '.prisma/client';

(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const axios = (await import('axios')).default;
  const request = axios.create({
    timeout: 10000,
  });
  const cheerio = (await import('cheerio')).default;
  const trimRss = (text: string) =>
    text.replace('<![CDATA[', '').replace(']]>', '').trim();
  const articles = [];
  for (let i = sources.length - 1; i > sources.length - 2; i--) {
    for (let j = 0; j < sources[i].url.length; j++) {
      const resp = await request.get(sources[i].url[j]);
      const data = resp.data;
      const $ = cheerio.load(data, { xmlMode: true });
      const items = $('rss').find('item').toArray();
      const _articles = items.map((item) => {
        const el = $(item);
        const title = trimRss(el.find('title').text());
        const category = trimRss(el.find('category').text());
        const link = trimRss(el.find('link').text());
        const pubDate = trimRss(el.find('pubDate').text());
        const dcDate = trimRss(el.find('dc\\:date').text());
        const author = trimRss(el.find('author').text());
        const _desc =
          '<div>' + trimRss(el.find('description').text()) + '</div>';
        const desc = cheerio.load(_desc)('div').text();
        const _content =
          '<div>' + trimRss(el.find('content\\:encoded').text()) + '</div>';
        const content = cheerio.load(_content)('div').text();
        return {
          source: sources[i].id,
          title,
          category,
          link,
          pubDate: !pubDate ? new Date(dcDate) : new Date(pubDate),
          author: !author ? '기사 참조' : author,
          desc,
          content,
        };
      });
      articles.push(..._articles);
    }
  }
  for (let k = 0; k < articles.length; k++) {
    try {
      await prisma.post.create({
        data: {
          title: articles[k].title,
          desc: articles[k].desc,
          link: articles[k].link,
          content: articles[k].content,
          published_at: articles[k].pubDate,
          author: articles[k].author,
          source_id: articles[k].source,
        },
      });
    } catch (err) {
      continue;
    }
  }
  await prisma.$disconnect();

  console.log('Done');
})();
