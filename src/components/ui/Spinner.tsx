interface SpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Spinner({ fullScreen, size = 'md' }: SpinnerProps) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  const spinner = (
    <div className={`${sizeClass} border-4 border-grove-green/30 border-t-grove-green rounded-full animate-spin`} />
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-grove-dark">
        {spinner}
      </div>
    );
  }
  return <div className="flex justify-center items-center py-8">{spinner}</div>;
}
