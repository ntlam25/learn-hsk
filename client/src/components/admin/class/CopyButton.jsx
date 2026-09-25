import { useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import Button from '../../ui/Button';

export default function CopyButton({ value, children = 'Sao chép', variant = 'chip' }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={variant}
      type="button"
      onClick={() =>
        copyText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        })
      }
    >
      {copied ? '✓ Đã sao chép' : children}
    </Button>
  );
}
