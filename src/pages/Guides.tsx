import { guides } from '../catalog/index.ts'
import { GuideCard } from '../components/cards.tsx'
import { DataControls } from '../components/DataControls.tsx'
import { Page, Section } from '../components/ui.tsx'
import { useTitle } from '../lib/use-title.ts'

export function Guides() {
  useTitle('Guides')
  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Guided migrations</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Checklists for the common moves, written in the order things actually have to happen. Tick steps off
        as you go and come back whenever: your place is kept on this device.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      <Section
        eyebrow="Your data"
        title="Take your progress with you"
        intro="Progress and notes live only in this browser. Export them to a file to back them up or to move to another device."
      >
        <DataControls />
      </Section>
    </Page>
  )
}
