import { Ignitor } from '#root/core/app/ignitor/ignitor.js'

await new Ignitor().boot().start()

// Removed kibamail-specific seeding commands - only essential auth stack setup remains
