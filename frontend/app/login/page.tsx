'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { api } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { errorMessage } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useAuth } from '@/store/auth';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setAuth, token } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (token) router.replace('/dashboard');
  }, [token, router]);

  useEffect(() => {
    if (params.get('expired')) toast.info('Your session expired. Please sign in again.');
    if (params.get('registered'))
      toast.success('Account created. Sign in with your new email and password.');
  }, [params]);

  async function onSubmit(values: LoginValues) {
    try {
      const res = await api.post('/auth/login', values);
      setAuth(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}.`);
      router.replace('/dashboard');
    } catch (err) {
      setError('root', { message: errorMessage(err, 'Unable to sign in') });
    }
  }

  function fill(email: string) {
    setValue('email', email);
    setValue('password', 'Passw0rd!');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
      <Field label="Password" required error={errors.password?.message}>
        {(id) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
        )}
      </Field>

      {errors.root && (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" fullWidth loading={isSubmitting}>
        Sign in
      </Button>

      <div className="flex flex-wrap gap-2 pt-1">
        {[
          ['Customer', 'customer@supportflow.demo'],
          ['Agent', 'agent@supportflow.demo'],
          ['Admin', 'admin@supportflow.demo'],
        ].map(([label, email]) => (
          <button
            key={email}
            type="button"
            onClick={() => fill(email)}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-gold/40 hover:text-gold"
          >
            Use {label}
          </button>
        ))}
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to SupportFlow"
      subtitle="Access your tickets, conversations and dashboard."
      footer={
        <>
          New here?{' '}
          <Link href="/signup" className="text-gold hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
