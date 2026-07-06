/**
 * golf-courses-hhq-merge.ts — Handicap HQ golf reconciliation overlay (Task 3).
 *
 * shared-data is the single golf-cite source. HHQ's former local golf fork was
 * already migrated onto the shared universe (HHQ renders `tdfDestinations()`),
 * so `scripts/reconcile-hhq-golf.ts` finds ZERO HHQ-only courses:
 *   - 994 shared golf courses ↔ 994 HHQ destination courses (1:1)
 *   - all 76 Golf Atlas marquee names resolve in SHARED_GOLF_COURSES
 *   - 0 field mismatches
 *
 * This file is the sanctioned place for any FUTURE HHQ-only course that has no
 * home in the regenerated `golf-courses.ts` (which must not be hand-edited).
 * Rows here carry `sites` including "handicap" and are real, deduped by
 * name+city against SHARED_GOLF_COURSES. It is empty today by design.
 *
 * Consumers read the combined `ALL_GOLF_COURSES` export from src/index.ts.
 */
import type { SharedGolfCourse } from "./golf-courses";

export const SHARED_GOLF_COURSES_HHQ_MERGE: SharedGolfCourse[] = [{"name":"Musselburgh Links – The Old Golf Course","city":"Musselburgh","state":"Scotland","region":"International","tier":"budget","greenFeeRange":[30,50],"style":"links","walkable":true,"driveMinutes":20,"highlight":"Guinness-recognized oldest golf course in the world and a former Open Championship venue, now a council-run public links; adult 9-hole green fees of £25.50 weekday / £28 weekend make it one of the great budget rounds in golf.","sites":["tdf","offsite","handicap"],"products":["golf-trip","retreat","outing"],"url":"https://enjoyleisure.com/venues-and-facilities/sports-and-leisure-centres/musselburgh-links-the-old-golf-course/"},{"name":"Corballis Golf Links","city":"Donabate","state":"County Dublin, Ireland","region":"International","tier":"budget","greenFeeRange":[33,40],"style":"links","walkable":true,"driveMinutes":30,"highlight":"Public pay-and-play links on the north Dublin coastline, owned by Fingal County Council with no membership required; €30 weekday / €35 weekend for 18 holes of genuine seaside links golf near Dublin Airport.","sites":["tdf","offsite","handicap"],"products":["golf-trip","retreat","outing"],"url":"https://corballislinks.com/"},{"name":"Athlone Golf Club","city":"Athlone","state":"County Roscommon, Ireland","region":"International","tier":"budget","greenFeeRange":[33,55],"style":"parkland","walkable":true,"driveMinutes":60,"highlight":"Lakeside championship parkland on the western shore of Lough Ree in the heart of Ireland; visitor green fees run €30–€40 weekday and €35–€50 weekend, with a signature hole set out on the lake — an hour from both Dublin and Galway.","sites":["tdf","offsite","handicap"],"products":["golf-trip","retreat","outing"],"url":"https://www.athlonegolfclub.ie/"},{"name":"Leven Links Golf Course","city":"Leven","state":"Fife, Scotland","region":"International","tier":"solid","greenFeeRange":[48,99],"style":"links","walkable":true,"driveMinutes":55,"highlight":"One of the world's oldest links courses and the first ever laid out with 18 separate tees and greens; a six-time Open Championship final qualifying venue with rolling dune-lined fairways, burns and pot bunkers.","sites":["tdf","offsite","handicap"],"products":["golf-trip","retreat","outing"],"url":"https://www.leven-links.com/"},{"name":"Ardglass Golf Club","city":"Ardglass","state":"County Down, Northern Ireland","region":"International","tier":"solid","greenFeeRange":[90,250],"style":"links","walkable":true,"driveMinutes":50,"highlight":"Clifftop links on the County Down coast with narrow fairways and small greens, playing out of the world's oldest golf clubhouse (dating to 1405AD); endorsed by Ryder Cup player Ronan Rafferty.","sites":["tdf","offsite","handicap"],"products":["golf-trip","retreat","outing"],"url":"https://ardglassgolfclub.com/green-fees/"}];
