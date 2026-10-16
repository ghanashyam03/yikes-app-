import type { CalendarEvent, Moment } from './types';

/**
 * Calendar module presence check.
 * Note: Since expo-calendar is not bundled in dependencies, we provide a safe,
 * robust fallback mock that simulates the just-in-time permission flow and returns
 * sample candidate events for the user to tick.
 *
 * STATUS: UNVERIFIED (Native expo-calendar module not in mobile dependencies).
 */
export const IS_NATIVE_CALENDAR_AVAILABLE = false;

let permissionGrantedInMemory = false;

/**
 * Requests calendar permission JUST-IN-TIME.
 * GUARANTEE: Never requested at app launch or onboarding.
 * Only called when user explicitly taps "Add from calendar".
 */
export async function requestCalendarPermission(): Promise<boolean> {
  // If native expo-calendar is integrated in the future:
  // const { status } = await Calendar.requestCalendarPermissionsAsync();
  // return status === 'granted';

  // Fallback simulator for development and test environments
  permissionGrantedInMemory = true;
  return true;
}

export function hasCalendarPermission(): boolean {
  return permissionGrantedInMemory;
}

export function revokeCalendarPermissionSimulation(): void {
  permissionGrantedInMemory = false;
}

/**
 * Fetches candidate calendar events from the upcoming 14 days.
 * In production with expo-calendar, this queries device calendar IDs.
 */
export async function fetchCandidateEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const day1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day5 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Realistic sample calendar events for testing and fallback use
  return [
    {
      id: 'cal_evt_1',
      title: 'Quarterly roadmap sync with team',
      startDate: day1.toISOString(),
      location: 'Conference Room B / Meet',
      selected: false,
    },
    {
      id: 'cal_evt_2',
      title: 'Coffee catch-up with Alex',
      startDate: day3.toISOString(),
      location: 'Blue Bottle Cafe',
      selected: false,
    },
    {
      id: 'cal_evt_3',
      title: 'Design critique & feedback review',
      startDate: day5.toISOString(),
      location: 'Virtual',
      selected: false,
    },
  ];
}

/**
 * Privacy guarantee: Filter ONLY explicitly ticked events.
 * Retains zero unselected calendar entries.
 */
export function filterTickedEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((e) => e.selected === true);
}

/**
 * Converts ticked calendar events into clean Moment drafts.
 * Strips all external calendar metadata.
 */
export function convertEventsToMoments(events: CalendarEvent[]): Omit<Moment, 'id'>[] {
  const ticked = filterTickedEvents(events);

  return ticked.map((evt) => ({
    title: evt.title,
    eventDate: evt.startDate,
    description: evt.location ? `Location: ${evt.location}` : undefined,
    status: 'upcoming',
    momentType: evt.title.toLowerCase().includes('coffee')
      ? 'one-to-one'
      : evt.title.toLowerCase().includes('sync') || evt.title.toLowerCase().includes('review')
      ? 'meeting'
      : 'other',
    formality: 5,
    remindEveningBefore: true,
  }));
}
