import { formatDistanceToNow as fnsDistanceToNow, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDistanceToNow(dateStr: string): string {
  try {
    return fnsDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}
