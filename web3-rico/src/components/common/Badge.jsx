const cn = (...classes) => classes.filter(Boolean).join(' ');

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium';

  const variants = {
    default: 'bg-neutral-700 text-neutral-200 border border-neutral-600',
    success: 'bg-success-500/20 text-success-300 border border-success-500/30',
    warning: 'bg-warning-500/20 text-warning-300 border border-warning-500/30',
    error: 'bg-error-500/20 text-error-300 border border-error-500/30',
    premium: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white',
    ai: 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const getDotColor = (variant) => {
    const colors = {
      default: 'bg-neutral-400',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      premium: 'bg-white',
      ai: 'bg-secondary-500',
    };
    return colors[variant] || colors.default;
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {dot && <span className={cn('w-2 h-2 rounded-full', getDotColor(variant))} />}
      {children}
    </span>
  );
};

export default Badge;