'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

import Link from 'next/link';
import Image from 'next/image';

import { ArrowRight } from 'lucide-react';

import { Show, SignInButton } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import PurchaseButton from '@/components/PurchaseButton';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  const courses = useQuery(api.courses.getCourses);

  return (
    <div className='flex flex-col min-h-screen'>
      <main className='grow container mx-auto px-4 py-16'>
        <div className='text-center mb-16'>
          <h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-4'>
            Forge Your Path in Modern Development
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Master fullstack skills through engaging, project-based learning.
            Unlock your potential with MasterClass.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-16'>
          {courses
            ?.slice(0, 3)
            .map(({ _id, title, description, imageUrl, price }) => (
              <Card key={_id}>
                <Link href={`/courses/${_id}`} className='cursor-pointer'>
                  <CardHeader>
                    <Image
                      className='rounded-md object-cover'
                      alt={title}
                      src={imageUrl}
                      width={640}
                      height={360}
                      // unoptimized
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
                      <Button variant={'outline'}>Enroll Now</Button>
                    </SignInButton>
                  </Show>
                </CardFooter>
              </Card>
            ))}
        </div>

        <div className='text-center'>
          <Link href='/pro'>
            <Button
              size='lg'
              className='group hover:bg-purple-600 transition-colors duration-300'
            >
              Explore Pro Plans
              <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
