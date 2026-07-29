import { useMemo, useState } from 'react'
import {
  PEPTIDES,
  SERUM_BASES,
  CUSTOM_PEPTIDES,
  PEPTIDE_LEGAL,
  buildSerumProduct,
  priceSerumBuild,
  SERUM_PRESETS,
} from '../data/skincare'

const empty = () => ({
  baseId: SERUM_BASES[0].id,
  peptideIds: [PEPTIDES[0].id],
  customIds: [],
})

export default function SerumBuilder({ onAdd, onOpenProduct }) {
  const [build, setBuild] = useState(empty)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  const product = useMemo(() => buildSerumProduct(build), [build])
  const price = product?.price ?? 0
  const peptideCount = build.peptideIds.length

  function togglePeptide(id) {
    setError('')
    setBuild((prev) => {
      const has = prev.peptideIds.includes(id)
      if (has) {
        if (prev.peptideIds.length <= 1) {
          setError('Keep at least one peptide in your serum.')
          return prev
        }
        return { ...prev, peptideIds: prev.peptideIds.filter((x) => x !== id) }
      }
      if (prev.peptideIds.length >= 4) {
        setError('Maximum four peptides per serum. Deselect one to swap.')
        return prev
      }
      return { ...prev, peptideIds: [...prev.peptideIds, id] }
    })
  }

  function toggleCustom(id) {
    setError('')
    setBuild((prev) => {
      const has = prev.customIds.includes(id)
      return {
        ...prev,
        customIds: has
          ? prev.customIds.filter((x) => x !== id)
          : [...prev.customIds, id],
      }
    })
  }

  function applyPreset(preset) {
    setError('')
    setAgreed(false)
    setBuild({
      baseId: preset.baseId,
      peptideIds: [...preset.peptideIds],
      customIds: [...(preset.customIds || [])],
    })
  }

  function handleAdd() {
    if (!agreed) {
      setError('Confirm the peptide research / cosmetic use acknowledgment to continue.')
      return
    }
    if (!product) {
      setError('Choose a base and at least one peptide.')
      return
    }
    onAdd?.(product)
  }

  return (
    <section className="sk-builder" id="build">
      <div className="sk-section-head">
        <p className="sk-eyebrow">Build your serum</p>
        <h2>Add 1, 2, 3, or all four peptides to one serum or the cream.</h2>
        <p>
          Four cores: GHK-Cu (staple), Matrixyl 3000, Syn-Ake, SNAP-8. Choose Buffet
          serum, peptide cream, or eye serum. Optional Eyeseryl / Argireline / extra
          copper as customs. Powder stays dry until you activate.
        </p>
      </div>

      <div className="sk-presets">
        <p className="sk-presets-label">Start from a preset</p>
        <div className="sk-presets-row">
          {SERUM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="sk-preset"
              onClick={() => applyPreset(p)}
            >
              <strong>{p.name}</strong>
              <span>{p.blurb}</span>
              <em>${priceSerumBuild(p).toFixed(0)}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="sk-builder-grid">
        <div className="sk-builder-col">
          <h3>1. Choose your vehicle</h3>
          <p className="sk-step-note">Two serums + one cream. One mix per order line.</p>
          <div className="sk-option-list">
            {SERUM_BASES.map((base) => (
              <label
                key={base.id}
                className={`sk-option ${build.baseId === base.id ? 'is-on' : ''}`}
              >
                <input
                  type="radio"
                  name="serum-base"
                  checked={build.baseId === base.id}
                  onChange={() => {
                    setError('')
                    setBuild((prev) => ({ ...prev, baseId: base.id }))
                  }}
                />
                <span className="sk-option-body">
                  <strong>{base.name}</strong>
                  <span>{base.blurb}</span>
                  <em>
                    {base.form === "cream" ? "Cream" : "Serum"}, {base.bestFor}, from $
                    {base.price}
                  </em>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="sk-builder-col">
          <h3>2. Add peptides ({peptideCount}/4)</h3>
          <p className="sk-step-note">Select any combination, one through all four.</p>
          <div className="sk-option-list">
            {PEPTIDES.map((pep) => {
              const on = build.peptideIds.includes(pep.id)
              return (
                <label key={pep.id} className={`sk-option sk-option-check ${on ? 'is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => togglePeptide(pep.id)}
                  />
                  <span className="sk-option-body">
                    <strong>
                      {pep.name} <small>+${pep.price}</small>
                    </strong>
                    <span>{pep.blurb}</span>
                    <em>{pep.job || pep.need}</em>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="sk-builder-col">
          <h3>3. Optional custom add-ons</h3>
          <p className="sk-step-note">Extra peptide load for a personalized order.</p>
          <div className="sk-option-list">
            {CUSTOM_PEPTIDES.map((c) => {
              const on = build.customIds.includes(c.id)
              return (
                <label key={c.id} className={`sk-option sk-option-check ${on ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleCustom(c.id)} />
                  <span className="sk-option-body">
                    <strong>
                      {c.name} <small>+${c.price}</small>
                    </strong>
                    <span>{c.blurb}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <aside className="sk-builder-summary">
        <div className="sk-summary-top">
          <div>
            <p className="sk-eyebrow">Your mix</p>
            <h3>{product?.name || 'Select peptides'}</h3>
            <p>{product?.subtitle}</p>
          </div>
          <p className="sk-summary-price">${price.toFixed(0)}</p>
        </div>

        {product && (
          <ul className="sk-summary-list">
            <li>
              <strong>Base</strong> {product.buildSummary.base}
            </li>
            <li>
              <strong>Peptides</strong> {product.buildSummary.peptides.join(', ')}
            </li>
            {product.buildSummary.customs.length > 0 && (
              <li>
                <strong>Custom</strong> {product.buildSummary.customs.join(', ')}
              </li>
            )}
          </ul>
        )}

        <div className="sk-legal-box">
          <p className="sk-legal-title">Peptide acknowledgment</p>
          <p>{PEPTIDE_LEGAL.medium}</p>
          <label className="sk-legal-check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
                setError('')
              }}
            />
            <span>
              I understand these are cosmetic topical peptide products, not drugs or
              medical treatments, and I am 18+ ordering for personal cosmetic use.
            </span>
          </label>
        </div>

        {error && <p className="sk-builder-error">{error}</p>}

        <div className="sk-summary-actions">
          <button type="button" className="primary-btn" onClick={handleAdd} disabled={!product}>
            Add mix to bag (${price.toFixed(0)})
          </button>
          {product && (
            <button type="button" className="soft-btn" onClick={() => onOpenProduct?.(product)}>
              Full details
            </button>
          )}
        </div>
        <p className="sk-legal-micro">{PEPTIDE_LEGAL.short}</p>
      </aside>
    </section>
  )
}
