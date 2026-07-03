import { COUNTRY_FLAGS } from '@/lib/types';

interface Props {
  countryCode: string;
  size?: number;
}

export default function CountryFlag({ countryCode, size = 24 }: Props) {
  const flag = COUNTRY_FLAGS[countryCode.toUpperCase()] || '\ud83c\udff4';
  return <span style={{ fontSize: size }}>{flag}</span>;
}
