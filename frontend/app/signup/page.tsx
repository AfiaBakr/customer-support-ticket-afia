'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Headset, User } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { api } from '@/lib/api';
import { signupSchema, type SignupValues } from '@/lib/validation';
import { cn, errorMessage } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useAuth } from '@/store/auth';

export default function SignupPage() {
  const router = useRouter();
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'customer' },
  });

  const role = watch('role');

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  async function onSubmit(values: SignupValues) {
    try {
      const { confirmPassword: _ignored, ...payload } = values;
      // Create the account only — the user then signs in explicitly.
      await api.post('/auth/register', payload);
      toast.success('Account created. Please sign in to continue.');
      router.replace('/login?registered=1');
    } catch (err) {
      setError('root', { message: errorMessage(err, 'Unable to create account') });
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start submitting or resolving tickets in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="I am a…">
          {() => (
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'customer', label: 'Customer', icon: User, hint: 'Submit tickets' },
                { value: 'agent', label: 'Support Agent', icon: Headset, hint: 'Resolve tickets' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('role', opt.value as SignupValues['role'])}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition',
                    role === opt.value
                      ? 'border-gold bg-gold/10'
                      : 'border-line hover:border-gold/40',
                  )}
                >
                  <opt.icon
                    className={cn('h-4 w-4', role === opt.value ? 'text-gold' : 'text-muted')}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted">{opt.hint}</span>
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Full name" required error={errors.name?.message}>
          {(id) => (
            <Input id={id} autoComplete="name" placeholder="Jordan Lee" {...register('name')} />
          )}
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register('email')}
            />
          )}
        </Field>
        <Field
          label="Password"
          required
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
            />
          )}
        </Field>
        <Field
          label="Confirm password"
          required
          error={errors.confirmPassword?.message}
        >
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          )}
        </Field>

        {errors.root && (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
