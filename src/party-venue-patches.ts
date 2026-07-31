/**
 * party-venue-patches.ts — the SANCTIONED ENRICHMENT TARGET for existing party
 * venues. Machine-appended, like `party-venues-expansion.ts`.
 *
 * WHY A SECOND FILE INSTEAD OF REUSING THE APPEND PATH.
 * `attachPartyVenues` adds venues and lets the CURATED row win on a name
 * collision — correct, so a researched row can never overwrite reviewed copy.
 * The consequence is that it can never enrich an existing row, and every item
 * in the Phase 2 backfill lane is enrichment of curated rows:
 *
 *   - coordinates (0 of 4,251 rows carry lat/lng today)
 *   - URLs + provenance (47 of ~4,200 party rows)
 *   - the `groupMin` re-grade (1,107 rows at the editorial default of 4)
 *   - bedroom / occupancy counts, reservation + private-dining data
 *
 * None of those are appends. Hence this file.
 *
 * THE ASYMMETRY THAT MATTERS:
 *   append → curated row WINS   (never overwrite reviewed copy with a new venue)
 *   patch  → curated value LOSES (the whole point is correcting an editorial
 *                                 default, or filling a blank)
 *
 * Because a patch CAN change a claim a user reads, every patch must carry
 * `sourceUrl` + `citations` — the bar `research-schema.ts` already sets for a
 * new row. Pure normalisation work (e.g. "USA" → "United States") is NOT a
 * research patch and does not belong here; it is a regeneration/hand edit.
 *
 * Curated files stay machine-untouched, exactly as with the expansion file.
 */
import type { PartyVenueCategory } from "./research-schema";

/**
 * A field-level patch against ONE existing party venue.
 *
 * `destinationId` + `category` + `name` are the KEY, not payload —
 * `applyPartyVenuePatches` strips all three before merging, so a patch can
 * never rename a venue or move it to another destination or category.
 *
 * The key is structured rather than the single delimited string
 * `${destId}|${category}|${name}` that `TAG_OVERRIDES` uses, because venue
 * names are free text: a name containing the delimiter would silently key the
 * wrong row, and this mechanism is allowed to overwrite rendered values.
 */
export type PartyVenuePatch = {
  destinationId: string;
  category: PartyVenueCategory;
  name: string;
  sourceUrl: string;
  citations: string[];
} & Record<string, unknown>;

export const PARTY_VENUE_PATCHES: PartyVenuePatch[] = [{"destinationId":"atlanta-ga","category":"lodging","name":"Hotel Clermont","url":"https://www.hotelclermont.com/","sourceUrl":"https://www.oliverhospitality.com/clermont","citations":["https://www.oliverhospitality.com/clermont","https://www.hotelclermont.com/hotel"]},{"destinationId":"atlanta-ga","category":"lodging","name":"The Loews Atlanta Hotel","url":"https://www.loewshotels.com/atlanta-hotel","sourceUrl":"https://www.loewshotels.com/press/news/luxury-atlanta-loews-hotel","citations":["https://www.loewshotels.com/press/news/luxury-atlanta-loews-hotel","https://www.loewshotels.com/atlanta-hotel"]},{"destinationId":"atlanta-ga","category":"lodging","name":"Four Seasons Atlanta","url":"https://www.fourseasons.com/atlanta/","sourceUrl":"https://press.fourseasons.com/atlanta/","citations":["https://press.fourseasons.com/atlanta/","https://www.fourseasons.com/atlanta/accommodations/"]},{"destinationId":"atlanta-ga","category":"lodging","name":"The St. Regis Atlanta","url":"https://www.marriott.com/en-us/hotels/atlxr-the-st-regis-atlanta/overview/","sourceUrl":"https://www.marriott.com/en-us/hotels/atlxr-the-st-regis-atlanta/overview/","citations":["https://www.marriott.com/en-us/hotels/atlxr-the-st-regis-atlanta/overview/"]},{"destinationId":"atlanta-ga","category":"lodging","name":"The Burgess Hotel","url":"https://www.marriott.com/en-us/hotels/atlnt-the-burgess-hotel-atlanta-a-tribute-portfolio-hotel/overview/","sourceUrl":"https://www.marriott.com/en-us/hotels/atlnt-the-burgess-hotel-atlanta-a-tribute-portfolio-hotel/overview/","citations":["https://www.marriott.com/en-us/hotels/atlnt-the-burgess-hotel-atlanta-a-tribute-portfolio-hotel/overview/","https://www.hospitalityonline.com/the-burgess"]},{"destinationId":"bozeman-mt","category":"lodging","name":"Kimpton Armory Hotel Bozeman","url":"https://www.armoryhotelbzn.com/","sourceUrl":"https://www.armoryhotelbzn.com/bozeman-boutique-hotel/","citations":["https://www.armoryhotelbzn.com/","https://www.armoryhotelbzn.com/bozeman-boutique-hotel/"]},{"destinationId":"bozeman-mt","category":"lodging","name":"Kimpton Armory Hotel","url":"https://www.armoryhotelbzn.com/","sourceUrl":"https://www.armoryhotelbzn.com/bozeman-boutique-hotel/","citations":["https://www.armoryhotelbzn.com/","https://www.armoryhotelbzn.com/bozeman-accommodations/"]},{"destinationId":"bozeman-mt","category":"lodging","name":"Element Bozeman","url":"https://www.marriott.com/en-us/hotels/bznel-element-bozeman/overview/","sourceUrl":"https://www.marriott.com/en-us/hotels/bznel-element-bozeman/overview/","citations":["https://www.marriott.com/en-us/hotels/bznel-element-bozeman/overview/","https://www.marriott.com/en-us/hotels/bznel-element-bozeman/rooms/"]},{"destinationId":"chicago-il","category":"lodging","name":"Soho House Chicago","url":"https://www.sohohouse.com/en-us/houses/soho-house-chicago","sourceUrl":"https://www.sohohouse.com/en-us/houses/soho-house-chicago","citations":["https://www.sohohouse.com/en-us/houses/soho-house-chicago","https://www.sohohouse.com/en-us/houses/soho-house-chicago/bedrooms"]},{"destinationId":"chicago-il","category":"lodging","name":"The Robey Chicago","url":"https://www.therobey.com/","sourceUrl":"https://www.therobey.com/","citations":["https://www.therobey.com/","https://www.therobey.com/about/"]},{"destinationId":"chicago-il","category":"lodging","name":"The Langham Chicago","url":"https://www.langhamhotels.com/en/the-langham/chicago/","sourceUrl":"https://www.langhamhotels.com/en/the-langham/chicago/","citations":["https://www.langhamhotels.com/en/the-langham/chicago/","https://www.choosechicago.com/listing/the-langham-chicago/"]},{"destinationId":"chicago-il","category":"lodging","name":"The Hoxton Chicago","url":"https://thehoxton.com/chicago/","sourceUrl":"https://thehoxton.com/chicago/","citations":["https://thehoxton.com/chicago/","https://www.shapack.com/the-hoxton"]},{"destinationId":"dallas-tx","category":"lodging","name":"The Joule Dallas","url":"https://www.thejouledallas.com/","sourceUrl":"https://www.thejouledallas.com/the-hotel/about-the-joule","citations":["https://www.thejouledallas.com/the-hotel/about-the-joule","https://www.lhw.com/hotel/The-Joule-Dallas-TX"]},{"destinationId":"dallas-tx","category":"lodging","name":"The Joule","url":"https://www.thejouledallas.com/","sourceUrl":"https://www.thejouledallas.com/the-hotel/about-the-joule","citations":["https://www.thejouledallas.com/the-hotel/about-the-joule","https://www.lhw.com/hotel/The-Joule-Dallas-TX"]},{"destinationId":"dallas-tx","category":"lodging","name":"The Adolphus","url":"https://www.adolphus.com/","sourceUrl":"https://www.adolphus.com/our-hotel","citations":["https://www.adolphus.com/our-hotel","https://www.marriott.com/en-us/hotels/dalak-the-adolphus-autograph-collection/overview/"]},{"destinationId":"dallas-tx","category":"lodging","name":"Hotel Crescent Court","url":"https://www.crescentcourt.com/","sourceUrl":"https://www.crescentcourt.com/","citations":["https://crescent.com/portfolio/hotel-crescent-court/","https://www.visitdallas.com/directory/hotel-crescent-court/"]},{"destinationId":"dallas-tx","category":"lodging","name":"Hotel ZaZa Dallas","url":"https://www.hotelzaza.com/dallas","sourceUrl":"https://www.hotelzaza.com/dallas","citations":["https://www.visitdallas.com/directory/hotel-zaza-dallas/","https://www.hotelzaza.com/dallas/amenities"]},{"destinationId":"destin-fl","category":"lodging","name":"The Henderson Beach Resort & Spa","url":"https://www.hendersonbeachresort.com/","sourceUrl":"https://www.visitflorida.com/listing/henderson-beach-resort/28719/","citations":["https://www.visitflorida.com/listing/henderson-beach-resort/28719/"]},{"destinationId":"destin-fl","category":"lodging","name":"Henderson Beach Resort","url":"https://www.hendersonbeachresort.com/","sourceUrl":"https://www.visitflorida.com/listing/henderson-beach-resort/28719/","citations":["https://www.visitflorida.com/listing/henderson-beach-resort/28719/"]},{"destinationId":"destin-fl","category":"lodging","name":"Sandestin Golf and Beach Resort","url":"https://www.sandestin.com/","sourceUrl":"https://www.visitsouthwalton.com/listing/sandestin-golf-beach-resort-5887/","citations":["https://www.visitsouthwalton.com/listing/sandestin-golf-beach-resort-5887/"]},{"destinationId":"destin-fl","category":"lodging","name":"The Palms of Destin Resort","url":"https://www.palmsofdestinflorida.com/","sourceUrl":"https://www.visitflorida.com/listing/the-palms-of-destin-resort-&-conference-center/27426/","citations":["https://www.visitflorida.com/listing/the-palms-of-destin-resort-&-conference-center/27426/"]}];
