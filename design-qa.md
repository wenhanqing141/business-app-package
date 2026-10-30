# Design QA: AI 创建问答卡

## Comparison target

- Source visual truth: `/var/folders/3m/rbqqd38510n75jhx9_wfyrx40000gn/T/codex-clipboard-ace95280-10b2-423d-9954-a2a4425cce38.png` (1600 x 1080 px).
- Implementation: `http://127.0.0.1:5176/#/builder/ai-create`, browser-rendered during this QA run at the desktop in-app browser viewport (1280 x 720 CSS px, device scale factor not overridden).
- State: Campus maintenance suggestion selected; all three analysis questions answered; completion progress is 3/3 and the primary blueprint action is enabled. Submission was exercised and produced the blueprint-confirmation state.
- Evidence: source image opened from the supplied attachment; implementation captured in the in-app browser during the same state review. The implementation capture is browser-session evidence and has no persistent file path.

## Intentional differences

The supplied image is the previous question-card treatment. This task explicitly requested a reorganization of the information hierarchy while retaining the AI-create empty-state visual language and Element/HeroUI component approach. The review therefore checks visual-system fidelity and core interaction, not pixel-for-pixel preservation of the older hierarchy.

## Fidelity review

- Fonts and typography: Passed. The question title is now a distinct 14 px semibold level, helper text is quieter, and the card title/progress relationship reads before individual inputs. No unintended wrapping or truncation was visible at the tested desktop width.
- Spacing and layout rhythm: Passed. Questions are separated by consistent dividers and 18 px vertical blocks. The submit area is structurally separated and, after the flow adjustment, remains above the composer rather than being occluded by it.
- Colors and visual tokens: Passed. The treatment uses the existing light surface, restrained blue selection state, low-contrast borders, and a single primary action. Selected, disabled, focus, and completion states are visually differentiated.
- Image quality and asset fidelity: Passed. This screen has no new raster assets. Existing application icons remain in use; no replacement imagery or drawn substitutes were introduced.
- Copy and content: Passed. The copy now explains why data is requested, surfaces a 0/3 to 3/3 completion state, and uses the action-specific label `生成业务蓝图`.

## Interaction coverage

- Selected an approval radio option.
- Selected two role checkboxes.
- Applied a preset scale value to the Element input.
- Verified progress changed from 0/3 to 3/3 and the primary action enabled.
- Submitted the completed card and verified the answered summary plus blueprint-confirmation state.

## Comparison history

1. [P1] The fixed bottom composer overlaid the question-card primary action in the initial implementation capture.
   - Fix: the composer returns to normal panel flow while the analysis question card is active; the message stream uses the corresponding normal bottom spacing.
   - Post-fix evidence: the completed card shows `生成业务蓝图` fully above the composer, and the action successfully advances to the blueprint state.

## Findings

No actionable P0, P1, or P2 differences remain for the requested redesign. The narrower mobile layout is covered in CSS but was not browser-captured in this desktop QA pass.

## Follow-up polish

- [P3] Capture a narrow mobile viewport in a subsequent responsive QA pass if this route is expected to be used from phones.

final result: passed
