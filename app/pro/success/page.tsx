import { Suspense } from 'react';
import { Check, Sparkles } from 'lucide-react';

import SuccessPageContent from './SuccessPageContent';

const LoadingFallback = () => {
  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md text-center'>
        {/* Animated icon */}
        <div className='relative mx-auto mb-8 h-20 w-20'>
          <div className='absolute inset-0 rounded-full bg-purple-500/20 animate-ping' />

          <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25'>
            <Sparkles className='h-9 w-9 text-white animate-pulse' />
          </div>
        </div>

        {/* Text */}
        <h2 className='text-2xl font-bold tracking-tight'>
          Activating your Pro experience
        </h2>

        <p className='mt-3 text-muted-foreground'>
          We&apos;re getting everything ready for you...
        </p>

        {/* Progress indicator */}
        <div className='mt-8 h-1.5 w-full overflow-hidden rounded-full bg-muted'>
          <div className='h-full w-1/2 rounded-full bg-linear-to-r from-purple-500 to-pink-500 animate-[loading_1.5s_ease-in-out_infinite]' />
        </div>

        {/* Status */}
        <div className='mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10'>
            <Check className='h-3 w-3 text-green-500' />
          </span>
          Verifying your subscription
        </div>
      </div>
    </div>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
};

export default SuccessPage;
