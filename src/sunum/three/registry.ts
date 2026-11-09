import type { Tag } from '../types'

/** Single data table for every inspectable 3D object: name, function, and label (PHYSICAL = real-world, DESIGN = our design, SIMULATED = demo only). */
export interface Part { name: string; fn: string; tag: Extract<Tag, 'PHYSICAL' | 'DESIGN' | 'SIMULATED'>; tech?: string }

export const PARTS = {
  'card-body': { name: 'Card body', fn: 'Plastic carrier (ISO/IEC 7810 ID-1 size) that holds the coil and the chip.', tag: 'PHYSICAL', tech: '85.6 × 54 mm, layered PVC/PET' },
  'card-antenna': { name: 'Card antenna coil', fn: 'Copper loop that catches the reader field and turns it into voltage; it also carries the card reply.', tag: 'PHYSICAL', tech: 'Resonates near 13.56 MHz' },
  'card-chip': { name: 'Card chip', fn: 'Secure microcontroller: runs the card application, holds keys and the record, answers the reader.', tag: 'PHYSICAL', tech: 'Powered only by the induced voltage; no battery' },
  'reader-body': { name: 'Reader housing', fn: 'Protects the reader electronics and shows where to tap.', tag: 'PHYSICAL' },
  'reader-coil': { name: 'Reader coil', fn: 'Creates the alternating magnetic field that powers the card and carries the reader commands.', tag: 'PHYSICAL', tech: '13.56 MHz, field about 1.5–7.5 A/m' },
  'reader-screen': { name: 'Reader screen', fn: 'Shows the result to the passenger: green = accepted, red = refused.', tag: 'PHYSICAL' },
  'field-rings': { name: 'Magnetic field (schematic)', fn: 'Rings show the field extent. The real field is invisible and reaches only a few centimetres.', tag: 'DESIGN' },
  'bus-body': { name: 'Bus body', fn: 'Vehicle that carries passengers and the on-board equipment.', tag: 'PHYSICAL' },
  'bus-validator': { name: 'Validator', fn: 'On-board reader that checks the card and returns the fare result.', tag: 'PHYSICAL' },
  'bus-computer': { name: 'Vehicle computer', fn: 'Collects validator requests and sends them to the backend over the modem.', tag: 'PHYSICAL' },
  'bus-modem': { name: 'Modem and roof antenna', fn: 'Mobile-network link between the bus and the backend.', tag: 'PHYSICAL' },
  'pos-body': { name: 'POS terminal', fn: 'Payment terminal: reads the card and sends an authorisation request.', tag: 'PHYSICAL' },
  'pos-screen': { name: 'POS screen', fn: 'Shows amount and result. In this deck no payment is real.', tag: 'SIMULATED' },
  'character': { name: 'Derya (main character)', fn: 'The passenger whose journey the deck follows. A fictional person.', tag: 'DESIGN' },
  'building': { name: 'Building', fn: 'Street scenery that keeps the scene spatially consistent.', tag: 'DESIGN' },
  'road': { name: 'Road and pavement', fn: 'Scenery that shows where the vehicle stops.', tag: 'DESIGN' },
  'flow-radio': { name: 'Radio link (card ↔ reader)', fn: 'Short-range electromagnetic communication. Ends at the validator.', tag: 'PHYSICAL' },
  'flow-data': { name: 'Software data flow', fn: 'Signed request moving through cable, modem and network. Not radio any more.', tag: 'PHYSICAL' },
  'flow-auth': { name: 'Payment authorisation', fn: 'Permission to take money from an account.', tag: 'SIMULATED' },
  'flow-fee': { name: 'Fare validation', fn: 'Fare engine decides the price from the tariff and trip history.', tag: 'DESIGN' },
  'flow-settle': { name: 'Financial settlement', fn: 'Later reconciliation that moves money between the parties.', tag: 'SIMULATED' },
} as const satisfies Record<string, Part>

export type PartId = keyof typeof PARTS
export const isPartId = (id: unknown): id is PartId => typeof id === 'string' && id in PARTS
