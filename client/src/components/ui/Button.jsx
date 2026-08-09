const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  'ghost-sm': 'btn-ghost-sm',
  chip: 'btn-chip',
  'chip-danger': 'btn-chip btn-chip-danger',
  'link-danger': 'btn-link-danger',
};

export default function Button({ variant = 'primary', className = '', ...rest }) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  return <button className={variantClass + (className ? ' ' + className : '')} {...rest} />;
}
