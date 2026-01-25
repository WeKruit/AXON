import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AxonErrorBoundary, ErrorFallback } from '../error-boundary';

// Component that throws an error
const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorFallback', () => {
  it('should render error message', () => {
    const error = new Error('Something went wrong');
    const resetErrorBoundary = jest.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should have accessible alert role', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = jest.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should call resetErrorBoundary when try again button is clicked', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = jest.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('should have accessible button', () => {
    const error = new Error('Test error');
    const resetErrorBoundary = jest.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />);

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toHaveAttribute('aria-label');
  });
});

describe('AxonErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <AxonErrorBoundary>
        <div>Child content</div>
      </AxonErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render default fallback when an error is thrown', () => {
    render(
      <AxonErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </AxonErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const CustomFallback = <div>Custom error UI</div>;

    render(
      <AxonErrorBoundary fallback={CustomFallback}>
        <ErrorThrowingComponent shouldThrow={true} />
      </AxonErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should call onError callback when an error is caught', () => {
    const onError = jest.fn();

    render(
      <AxonErrorBoundary onError={onError}>
        <ErrorThrowingComponent shouldThrow={true} />
      </AxonErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error message');
  });

  it('should recover when try again is clicked', () => {
    const TestComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <AxonErrorBoundary onReset={() => setShouldThrow(false)}>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </AxonErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Initially shows error
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click try again
    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    // Should now render the content without error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should call onReset callback when reset is triggered', () => {
    const onReset = jest.fn();

    render(
      <AxonErrorBoundary onReset={onReset}>
        <ErrorThrowingComponent shouldThrow={true} />
      </AxonErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
