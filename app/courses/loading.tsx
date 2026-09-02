import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesLoading() {
  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold mb-8'>All Courses</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='flex flex-col'>
            <CardHeader>
              <Skeleton className='w-full h-50 rounded-md' />
            </CardHeader>
            <CardContent className='grow'>
              <Skeleton className='h-6 w-3/4 mb-2' />
            </CardContent>
            <CardFooter className='flex justify-between items-center'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-10 w-32' />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
