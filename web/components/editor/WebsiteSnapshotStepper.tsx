import { useEffect, useState, type ReactNode } from 'react'
import { Button, Chip, Input, LoadingSpinner, Textarea } from '@helpwave/hightide'
import { useGenerateWebsite } from '@/api/websiteBuilder'
import type { WebsiteAttributes, WebsiteContent } from '@/api/types/websiteContent'
import { useDomeTranslation, useLocale } from '@/i18n/useDomeTranslation'

const colors = [
  '#2f6f4f',
  '#1f4e8c',
  '#b3261e',
  '#c26a00',
  '#6b3fa0',
  '#0f766e',
  '#374151',
  '#be185d',
] as const

const maxSections = 12
const maxSectionLength = 200
const maxDescriptionLength = 4000

type CategoryId = 'verein' | 'unternehmen' | 'praxis' | 'gastronomie' | 'handwerk' | 'sonstiges'
type StyleId = 'klar' | 'warm' | 'modern'
type AddressForm = 'sie' | 'du'
type PageLanguage = 'de' | 'en'
type EditorStep = 'start' | 'about' | 'sections' | 'look' | 'loading'

const steps: EditorStep[] = ['start', 'about', 'sections', 'look']

type WebsiteSnapshotStepperProps = {
  websiteId: string,
  websiteName: string,
  initialDescription: string,
  source?: WebsiteContent,
  onCancel?: () => void,
  onCreated: (content: WebsiteContent) => void,
}

type ChoiceProps = {
  pressed: boolean,
  onSelect: () => void,
  title: string,
  info?: string,
}

const Choice = ({
  pressed,
  onSelect,
  title,
  info,
}: ChoiceProps) => (
  <Button
    type="button"
    color={pressed ? 'primary' : 'neutral'}
    coloringStyle={pressed ? 'solid' : 'outline'}
    aria-pressed={pressed}
    className="h-auto flex-col items-start gap-1 px-3 py-3 text-left"
    onClick={onSelect}
  >
    <span className="typography-label-md">{title}</span>
    {info && <span className="typography-body">{info}</span>}
  </Button>
)

const Field = ({
  label,
  hint,
  children,
}: {
  label: string,
  hint?: string,
  children: ReactNode,
}) => (
  <label className="flex-col-1">
    <span className="typography-label-md">
      {label}
      {hint && <span className="typography-body text-description"> {hint}</span>}
    </span>
    {children}
  </label>
)

const pageLanguage = (value: string | undefined, locale: string): PageLanguage => {
  if (value === 'de' || value === 'en') {
    return value
  }
  return locale.startsWith('de') ? 'de' : 'en'
}

export const WebsiteSnapshotStepper = ({
  websiteId,
  websiteName,
  initialDescription,
  source,
  onCancel,
  onCreated,
}: WebsiteSnapshotStepperProps) => {
  const translation = useDomeTranslation()
  const { locale } = useLocale()
  const categories: { id: CategoryId, title: string, info: string }[] = [
    { id: 'verein', title: translation('editorCatClub'), info: translation('editorCatClubInfo') },
    { id: 'unternehmen', title: translation('editorCatBusiness'), info: translation('editorCatBusinessInfo') },
    { id: 'praxis', title: translation('editorCatPractice'), info: translation('editorCatPracticeInfo') },
    { id: 'gastronomie', title: translation('editorCatFood'), info: translation('editorCatFoodInfo') },
    { id: 'handwerk', title: translation('editorCatTrade'), info: translation('editorCatTradeInfo') },
    { id: 'sonstiges', title: translation('editorCatOther'), info: translation('editorCatOtherInfo') },
  ]
  const styles: { id: StyleId, title: string, info: string }[] = [
    { id: 'klar', title: translation('editorStyleClear'), info: translation('editorStyleClearInfo') },
    { id: 'warm', title: translation('editorStyleWarm'), info: translation('editorStyleWarmInfo') },
    { id: 'modern', title: translation('editorStyleModern'), info: translation('editorStyleModernInfo') },
  ]
  const matchedCategory = categories.find((item) => item.title === source?.attributes.category)?.id ?? ''
  const [step, setStep] = useState<EditorStep>('start')
  const [category, setCategory] = useState<CategoryId | ''>(matchedCategory)
  const [description, setDescription] = useState(source?.description ?? initialDescription)
  const [location, setLocation] = useState(source?.attributes.location ?? '')
  const [sections, setSections] = useState<string[]>(source?.attributes.sections ?? [])
  const [sectionDraft, setSectionDraft] = useState('')
  const [purpose, setPurpose] = useState(source?.attributes.purpose ?? '')
  const [color, setColor] = useState(source?.attributes.primary_color ?? colors[0])
  const [style, setStyle] = useState<StyleId>('klar')
  const [addressForm, setAddressForm] = useState<AddressForm>('sie')
  const [language, setLanguage] = useState<PageLanguage>(pageLanguage(source?.attributes.language, locale))
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [seeded, setSeeded] = useState((source?.description ?? initialDescription).length > 0)

  useEffect(() => {
    if (source || seeded || initialDescription.length === 0) {
      return
    }
    setDescription(initialDescription)
    setSeeded(true)
  }, [initialDescription, seeded, source])

  const generate = useGenerateWebsite({
    onSuccess: (content) => {
      onCreated(content)
    },
    onError: () => setStep('look'),
  })

  const addSection = () => {
    const value = sectionDraft.trim().slice(0, maxSectionLength)
    setSectionDraft('')
    if (value.length === 0 || sections.includes(value)) {
      return
    }
    if (sections.length >= maxSections) {
      setFieldError(translation('editorTooManySections'))
      return
    }
    setSections([...sections, value])
    setFieldError(undefined)
  }

  const attributes = (): WebsiteAttributes => {
    const selected = categories.find((item) => item.id === category)
    const selectedStyle = styles.find((item) => item.id === style)
    const tone = [
      selectedStyle?.title,
      addressForm === 'sie' ? translation('editorFormal') : translation('editorInformal'),
    ].filter((part) => part !== undefined).join(', ')
    return {
      ...(selected ? { category: selected.title } : {}),
      ...(purpose.trim().length > 0 ? { purpose: purpose.trim() } : {}),
      ...(location.trim().length > 0 ? { location: location.trim() } : {}),
      language,
      ...(tone.length > 0 ? { tone } : {}),
      ...(sections.length > 0 ? { sections } : {}),
      primary_color: color,
    }
  }

  const validateAbout = () => {
    if (category.length === 0) {
      setFieldError(translation('editorCategoryError'))
      return false
    }
    if (description.trim().length === 0) {
      setFieldError(translation('editorDescriptionError'))
      return false
    }
    setFieldError(undefined)
    return true
  }

  const goForward = (check: boolean) => {
    if (step === 'about' && check && !validateAbout()) {
      return
    }
    if (step === 'look') {
      if (!validateAbout()) {
        setStep('about')
        return
      }
      setStep('loading')
      generate.mutate({
        website_id: websiteId,
        description: description.trim(),
        attributes: attributes(),
      })
      return
    }
    const index = steps.indexOf(step)
    const next = steps[index + 1]
    if (next !== undefined) {
      setFieldError(undefined)
      setStep(next)
    }
  }

  const goBack = () => {
    const index = steps.indexOf(step)
    const previous = steps[index - 1]
    if (previous === undefined) {
      return
    }
    setFieldError(undefined)
    setStep(previous)
  }

  return (
    <div className="flex-col-4">
      {step === 'start' && (
        <section className="flex-col-4 rounded-lg bg-surface-variant p-5 text-on-surface">
          <p className="typography-label text-primary">{translation('editorKicker')}</p>
          <h2 className="typography-title-lg">{translation('editorHeadline')}</h2>
          <p className="typography-body text-description">{translation('editorLead')}</p>
          <div className="flex flex-wrap items-center gap-3">
            {onCancel && (
              <Button type="button" color="neutral" coloringStyle="outline" onClick={onCancel}>
                {translation('cancel')}
              </Button>
            )}
            <Button type="button" onClick={() => setStep('about')}>
              {translation('editorStart')}
            </Button>
          </div>
        </section>
      )}
      {step === 'about' && (
        <section className="flex-col-4 rounded-lg bg-surface-variant p-5 text-on-surface">
          <p className="typography-label text-primary">{translation('editorStep', { step: '1', total: '3' })}</p>
          <h2 className="typography-title-md">{translation('editorWhoTitle')}</h2>
          {websiteName.length > 0 && (
            <p className="typography-body text-description">{translation('editorUsesName', { name: websiteName })}</p>
          )}
          <fieldset className="flex-col-2">
            <legend className="typography-label-md">
              {translation('editorCategoryLegend')}
              <span className="typography-body text-description"> {translation('editorRequired')}</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 desktop:grid-cols-3" role="radiogroup">
              {categories.map((item) => (
                <Choice
                  key={item.id}
                  pressed={category === item.id}
                  title={item.title}
                  info={item.info}
                  onSelect={() => {
                    setCategory(item.id)
                    setFieldError(undefined)
                  }}
                />
              ))}
            </div>
          </fieldset>
          <Field label={translation('editorDescriptionLabel')} hint={translation('editorRequired')}>
            <Textarea
              value={description}
              maxLength={maxDescriptionLength}
              rows={5}
              placeholder={translation('editorDescriptionPlaceholder')}
              onValueChange={(value) => {
                setDescription(value)
                setFieldError(undefined)
              }}
            />
          </Field>
          <Field label={translation('editorPlaceLabel')} hint={translation('editorOptional')}>
            <Input
              value={location}
              maxLength={200}
              placeholder={translation('editorPlacePlaceholder')}
              onValueChange={setLocation}
            />
          </Field>
        </section>
      )}
      {step === 'sections' && (
        <section className="flex-col-4 rounded-lg bg-surface-variant p-5 text-on-surface">
          <p className="typography-label text-primary">{translation('editorStep', { step: '2', total: '3' })}</p>
          <h2 className="typography-title-md">{translation('editorOffersTitle')}</h2>
          <Field label={translation('editorSectionsLabel')} hint={translation('editorOptional')}>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral p-2">
              {sections.map((section) => (
                <Chip key={section} color="neutral" coloringStyle="tonal" size="sm">
                  <span className="flex-row-1 items-center">
                    {section}
                    <button
                      type="button"
                      aria-label={section}
                      onClick={() => setSections(sections.filter((item) => item !== section))}
                    >
                      ×
                    </button>
                  </span>
                </Chip>
              ))}
              <Input
                value={sectionDraft}
                maxLength={maxSectionLength}
                placeholder={translation('editorSectionPlaceholder')}
                disabled={sections.length >= maxSections}
                onValueChange={setSectionDraft}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    addSection()
                  }
                }}
                onBlur={addSection}
              />
            </div>
          </Field>
          <Field label={translation('editorPurposeLabel')} hint={translation('editorOptional')}>
            <Textarea
              value={purpose}
              maxLength={200}
              rows={3}
              placeholder={translation('editorPurposePlaceholder')}
              onValueChange={setPurpose}
            />
          </Field>
        </section>
      )}
      {step === 'look' && (
        <section className="flex-col-4 rounded-lg bg-surface-variant p-5 text-on-surface">
          <p className="typography-label text-primary">{translation('editorStep', { step: '3', total: '3' })}</p>
          <h2 className="typography-title-md">{translation('editorLookTitle')}</h2>
          <fieldset className="flex-col-2">
            <legend className="typography-label-md">{translation('editorColorLegend')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={item}
                  aria-pressed={color === item}
                  className="size-8 rounded-full border-2 border-transparent"
                  style={{
                    backgroundColor: item,
                    outline: color === item ? '2px solid var(--color-on-surface)' : undefined,
                  }}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>
            <label className="flex-row-2 items-center typography-body">
              {translation('editorCustomColor')}
              <input
                type="color"
                value={color}
                aria-label={translation('editorCustomColor')}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
          </fieldset>
          <fieldset className="flex-col-2">
            <legend className="typography-label-md">{translation('editorStyleLegend')}</legend>
            <div className="grid grid-cols-1 gap-2 desktop:grid-cols-3" role="radiogroup">
              {styles.map((item) => (
                <Choice
                  key={item.id}
                  pressed={style === item.id}
                  title={item.title}
                  info={item.info}
                  onSelect={() => setStyle(item.id)}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="flex-col-2">
            <legend className="typography-label-md">{translation('editorAddressLegend')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              <Choice
                pressed={addressForm === 'sie'}
                title={translation('editorFormal')}
                onSelect={() => setAddressForm('sie')}
              />
              <Choice
                pressed={addressForm === 'du'}
                title={translation('editorInformal')}
                onSelect={() => setAddressForm('du')}
              />
            </div>
          </fieldset>
          <fieldset className="flex-col-2">
            <legend className="typography-label-md">{translation('editorLanguageLabel')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              <Choice
                pressed={language === 'de'}
                title={translation('editorLanguageGerman')}
                onSelect={() => setLanguage('de')}
              />
              <Choice
                pressed={language === 'en'}
                title={translation('editorLanguageEnglish')}
                onSelect={() => setLanguage('en')}
              />
            </div>
          </fieldset>
        </section>
      )}
      {step === 'loading' && (
        <section className="flex-col-3 items-center rounded-lg bg-surface-variant p-8 text-on-surface">
          <LoadingSpinner />
          <h2 className="typography-title-md">{translation('editorGeneratingTitle')}</h2>
          <p className="typography-body text-description">{translation('editorGeneratingWait')}</p>
        </section>
      )}
      {fieldError && (
        <p className="typography-body text-negative" role="alert">{fieldError}</p>
      )}
      {generate.isError && step !== 'loading' && (
        <p className="typography-body text-negative" role="alert">
          {generate.error.message || translation('editorGenerationFailed')}
        </p>
      )}
      {(step === 'about' || step === 'sections' || step === 'look') && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" color="neutral" coloringStyle="outline" onClick={goBack}>
            {translation('back')}
          </Button>
          <span className="grow" />
          {step !== 'about' && (
            <Button type="button" color="neutral" coloringStyle="text" onClick={() => goForward(false)}>
              {translation('editorSkip')}
            </Button>
          )}
          <Button type="button" onClick={() => goForward(true)}>
            {step === 'look' ? translation('editorCreateSite') : translation('continue')}
          </Button>
        </div>
      )}
    </div>
  )
}
