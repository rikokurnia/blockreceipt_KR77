import { cn } from "../../utils/helpers";

const Card = ({
  children,
  className = "",
  hover = false,
  glass = false,
  gradient = false,
  ...props
}) => {
  const baseStyles = "rounded-2xl p-8 shadow-card transition-all duration-300";

  const variants = {
    default: "bg-neutral-800 border border-neutral-700",
    glass: "bg-neutral-800/30 backdrop-blur-md border border-neutral-700/50",
    gradient: "bg-gradient-dark border border-neutral-700/50",
  };

  const hoverStyles = hover
    ? "hover:border-secondary-500 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer"
    : "";

  const variantStyle = glass
    ? variants.glass
    : gradient
    ? variants.gradient
    : variants.default;

  return (
    <div
      className={cn(baseStyles, variantStyle, hoverStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
