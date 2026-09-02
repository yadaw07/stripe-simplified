import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

import Link from 'next/link';
import Image from 'next/image';

import { Show, SignInButton } from '@clerk/nextjs';

import { Badge } from '@/components/ui/badge';
import PurchaseButton from '@/components/PurchaseButton';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

const page = async () => {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const courses = await convex.query(api.courses.getCourses);

  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-8 '>All Courses</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {courses?.map(({ _id, title, price, imageUrl }) => (
          <Card key={_id} className='flex flex-col'>
            <Link href={`/courses/${_id}`} className='cursor-pointer'>
              <CardHeader>
                <Image
                  src={imageUrl}
                  alt={title}
                  width={640}
                  height={360}
                  className='rounded-md object-cover'
                />
              </CardHeader>
              <CardContent className='grow'>
                <CardTitle className='text-xl mb-2 hover:underline'>
                  {title}
                </CardTitle>
              </CardContent>
            </Link>

            <CardFooter className='flex justify-between items-center'>
              <Badge variant='default' className='text-lg px-3 py-1'>
                ${price.toFixed(2)}
              </Badge>
              <Show when={'signed-in'}>
                <PurchaseButton courseId={_id} />
              </Show>
              <Show when={'signed-out'}>
                <SignInButton mode='modal'>
                  <Button variant='outline'>Enroll Now</Button>
                </SignInButton>
              </Show>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default page;
