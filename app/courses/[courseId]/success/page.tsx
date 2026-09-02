import { use } from 'react';

import { Id } from '@/convex/_generated/dataModel';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Params {
  params: Promise<{ courseId: Id<'courses'> }>;
  searchParams: Promise<{ session_id: string }>;
}

const successPage = ({ params, searchParams }: Params) => {
  const { courseId } = use(params);
  const { session_id } = use(searchParams);

  return (
    <div className='container py-12 px-4 mx-auto'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader className='text-center'>
          <CheckCircle className='size-16 text-green-500 mb-4 mx-auto' />
          <CardTitle className='text-3xl font-bold text-green-700'>
            Purchase Successfull!
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center spacey-6'>
          <p className='text-xl text-gray-600'>
            Thank you for enrolling our course. Your journey to new skills and
            knowledge begins now!
          </p>

          <div className='bg-gray-100 p-4 rounded-md'>
            <p className='text-sm text-gray-500'>
              Transaction ID: {session_id}
            </p>
          </div>

          <div className='flex justify-center gap-4'>
            <Link href={`/courses/${courseId}`}>
              <Button className='w-full sm:w-auto flex items-center justify-center'>
                Go to course
              </Button>
            </Link>
            <Link href={`/courses`}>
              <Button variant='outline' className='w-full sm:w-auto'>
                Browse more courses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default successPage;
