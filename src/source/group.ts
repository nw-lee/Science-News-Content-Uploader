import { Post } from '.prisma/client';
import { PrismaClient } from '.prisma/client';

export interface IGroupByDate {
  [key: string]: Post[];
}

// Not Being Used
const getGroupByDate = async () => {
  const prisma = new PrismaClient();
  const obj: IGroupByDate = {};
  await prisma.$connect();

  const result = await prisma.post.findMany({});
  result.forEach((el, idx) => {
    const dt = el.published_at;
    el.published_at = new Date(dt.toISOString().split('T')[0]);

    if (!obj[el.published_at.toISOString()]) {
      obj[el.published_at.toISOString()] = [el];
    } else {
      obj[el.published_at.toISOString()].push(el);
    }
  });
  console.log(obj);
  await prisma.$disconnect();
};

export { getGroupByDate };
