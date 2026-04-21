import { WizardProvider } from '@/context/WizardContext'
import WizardShell from '@/components/wizard/WizardShell'

export default function Home() {
  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  )
}
