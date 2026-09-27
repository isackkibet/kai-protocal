import { UnifiedContentItem, EventMetadata } from '@/types/contentHub';

export interface CalendarEventItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  event: EventMetadata;
  coverImageUrl?: string;
  isUpcoming: boolean;
  startsAtDate: Date;
  endsAtDate?: Date;
}

export const calendarService = {
  /**
   * Format ISO date to human readable string (e.g., 'Thursday, Oct 14, 2026')
   */
  formatEventDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  },

  /**
   * Format ISO time (e.g., '9:00 AM EAT')
   */
  formatEventTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  },

  /**
   * Check if event is in the future
   */
  isUpcoming(startsAtIso: string): boolean {
    const eventTime = new Date(startsAtIso).getTime();
    return eventTime >= Date.now();
  },

  /**
   * Generate RFC 5545 compliant iCalendar (.ics) string for downloads
   */
  generateIcs(item: UnifiedContentItem): string {
    if (!item.event) return '';

    const formatIcsDate = (isoStr: string): string => {
      const d = new Date(isoStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatIcsDate(item.event.startsAt);
    const end = item.event.endsAt
      ? formatIcsDate(item.event.endsAt)
      : formatIcsDate(new Date(new Date(item.event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const title = item.title.replace(/[,;]/g, ' ');
    const description = (item.excerpt || item.title).replace(/[\n\r]/g, ' ');
    const location = (item.event.locationName + (item.event.address ? `, ${item.event.address}` : '')).replace(/[,;]/g, ' ');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sango Info Hub//SIHU Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:sihu-event-${item.id}@sihu.com`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      item.event.registrationUrl ? `URL:${item.event.registrationUrl}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
  },

  /**
   * Trigger browser file download of .ics
   */
  downloadIcs(item: UnifiedContentItem): void {
    if (typeof window === 'undefined') return;
    const icsContent = this.generateIcs(item);
    if (!icsContent) return;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${item.slug || 'sihu-event'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Generate Google Calendar web creation URL
   */
  getGoogleCalendarUrl(item: UnifiedContentItem): string {
    if (!item.event) return '#';

    const formatGDate = (isoStr: string): string => {
      const d = new Date(isoStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatGDate(item.event.startsAt);
    const end = item.event.endsAt
      ? formatGDate(item.event.endsAt)
      : formatGDate(new Date(new Date(item.event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: item.title,
      dates: `${start}/${end}`,
      details: `${item.excerpt}\n\nMore details: https://sihu.com/events/${item.slug}`,
      location: item.event.locationName + (item.event.address ? `, ${item.event.address}` : ''),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },
};
