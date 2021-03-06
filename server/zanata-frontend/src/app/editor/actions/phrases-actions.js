// @ts-nocheck
import {savePhrase, fetchTransUnitHistory} from '../api'
import { toggleDropdown } from '.'
import { createAction } from 'redux-actions'
import {
  COPY_FROM_SOURCE,
  COPY_FROM_ALIGNED_SOURCE,
  CANCEL_EDIT,
  UNDO_EDIT,
  SELECT_PHRASE,
  SELECT_PHRASE_SPECIFIC_PLURAL,
  PHRASE_TEXT_SELECTION_RANGE,
  TRANSLATION_TEXT_INPUT_CHANGED,
  TOGGLE_SAVE_WITH_ERROR_MODAL,
  QUEUE_SAVE,
  SAVE_INITIATED,
  PENDING_SAVE_INITIATED,
  SAVE_FINISHED,
  SAVE_FAILED,
  SAVE_CONFLICT,
  SAVE_CONFLICT_RESOLVED_LATEST,
  SAVE_CONFLICT_RESOLVED_ORIGINAL,
  TOGGLE_CONCURRENT_MODAL,
  VALIDATION_ERRORS
} from './phrases-action-types'
import {
  defaultSaveStatus,
  transUnitStatusToPhraseStatus,
  STATUS_REJECTED,
  STATUS_APPROVED,
  STATUS_TRANSLATED,
  STATUS_NEEDS_WORK
} from '../utils/status-util'
import { hasTranslationChanged } from '../utils/phrase-util'
import { fetchStatisticsInfo } from './header-actions'

/**
 * Copy from source text to the focused translation input.
 * Only change the input text, not the saved translation value.
 */
export const copyFromSource = createAction(COPY_FROM_SOURCE,
  (phraseId, sourceIndex) => ({ phraseId, sourceIndex }))

/**
 * Copy the source that is at the same plural index to the focused translation
 * plural. If there are not enough source plural forms, the highest one is used.
 */
export const copyFromAlignedSource = createAction(COPY_FROM_ALIGNED_SOURCE)

/**
 * Stop editing the currently focused phrase and discard all entered text.
 * After this action, no phrase should be in editing state.
 */
export const cancelEdit = createAction(CANCEL_EDIT)

/**
 * Discard all entered text for the currently selected phrase, reverting to
 * whatever translations are currently saved.
 * After this action, a phrase may still be in editing state.
 */
export const undoEdit = createAction(UNDO_EDIT)

/**
 * Open a modal to confirm saving a translation with validation errors.
 */
export const toggleSaveErrorModal = createAction(TOGGLE_SAVE_WITH_ERROR_MODAL,
  (phraseId, showValidationErrorModal) => ({
    phraseId,
    showValidationErrorModal
  }))

/**
 * Set the selected phrase to the given ID.
 * Only one phrase is selected at a time.
 */
export function selectPhrase (phraseId, localeId, projectSlug, versionSlug,
  activityVisible) {
  return (dispatch, getState) => {
    dispatch(savePreviousPhraseIfChanged(phraseId))
    dispatch(createAction(SELECT_PHRASE)(phraseId))
    if (activityVisible) {
      dispatch(fetchTransUnitHistory(
        localeId, phraseId, projectSlug, versionSlug))
    }
  }
}

const selectPhraseSpecificPlural = createAction(SELECT_PHRASE_SPECIFIC_PLURAL,
  (phraseId, index) => ({ phraseId, index }))

/**
 * Select a phrase and set which of its plurals is selected.
 * The selected plural index should persist even when the phrase loses focus
 * and gains it back again (unless it gains focus from a different plural form
 * being specifically targeted).
 */
export function selectPhrasePluralIndex (phraseId, index, localeId, projectSlug,
  versionSlug, activityVisible) {
  return (dispatch) => {
    dispatch(savePreviousPhraseIfChanged(phraseId))
    dispatch(selectPhraseSpecificPlural(phraseId, index))
    if (activityVisible) {
      dispatch(fetchTransUnitHistory(
        localeId, phraseId, projectSlug, versionSlug))
    }
  }
}

function savePreviousPhraseIfChanged (phraseId) {
  return (dispatch, getState) => {
    const previousPhraseId = getState().phrases.selectedPhraseId
    if (previousPhraseId && previousPhraseId !== phraseId) {
      const previousPhrase = getState().phrases.detail[previousPhraseId]
      if (previousPhrase && hasTranslationChanged(previousPhrase)) {
        dispatch(savePhraseWithStatus(previousPhrase,
          defaultSaveStatus(previousPhrase)))
      }
    }
  }
}

/**
 * Use to broadcast the cursor location or selection within the focused
 * translation text.
 *
 * @param start position of cursor or beginning of range
 * @param end position of cursor (if no range is selected) or end of range
 */
export const phraseTextSelectionRange =
  createAction(PHRASE_TEXT_SELECTION_RANGE, (start, end) => ({ start, end }))

// User has typed/pasted/etc. text for a translation (not saved yet)
export const translationTextInputChanged = createAction(
  TRANSLATION_TEXT_INPUT_CHANGED, (id, index, text) => ({ id, index, text }))

const queueSave = createAction(QUEUE_SAVE,
  (phraseId, saveInfo) => ({ phraseId, saveInfo }))

const saveInitiated = createAction(SAVE_INITIATED,
  (phraseId, saveInfo) => ({ phraseId, saveInfo }))

const pendingSaveInitiated = createAction(PENDING_SAVE_INITIATED)

// FIXME should use status and serverStatus to disambiguate
//       (these would be separate types if there were types.)
const saveFinished = createAction(SAVE_FINISHED,
  (phraseId, transUnitStatus, revision) => ({
    phraseId,
    status: transUnitStatusToPhraseStatus(transUnitStatus),
    revision
  }))

const saveFailed = createAction(SAVE_FAILED,
  (phraseId, saveInfo, response) => ({
    phraseId,
    saveInfo,
    response
  }))

const saveConflict = createAction(SAVE_CONFLICT,
  (phraseId, saveInfo, response) => ({
    phraseId,
    saveInfo,
    response
  }))

const saveConflictResolvedLatest = createAction(SAVE_CONFLICT_RESOLVED_LATEST,
  (phraseId, saveInfo, revision) => ({
    phraseId,
    saveInfo,
    revision
  }))

const saveConflictResolvedOriginal =
  createAction(SAVE_CONFLICT_RESOLVED_ORIGINAL,
  (phraseId, saveInfo, revision) => ({
    phraseId,
    saveInfo,
    revision
  }))

export const validationError = createAction(VALIDATION_ERRORS,
  (phraseId, hasValidationError) => ({
    phraseId,
    hasValidationError
  }))

export const toggleConcurrentModal = createAction(TOGGLE_CONCURRENT_MODAL)

export function saveResolveConflictLatest (latest, original) {
  return (dispatch, getState) => {
    const stateBefore = getState()
    dispatch(saveConflictResolvedLatest(
        latest.id, latest, latest.revision)).then(
        dispatch(fetchTransUnitHistory(
          original.localeId,
          latest.id,
          stateBefore.context.projectSlug,
          stateBefore.context.versionSlug
        )).then(
          fetchStatisticsInfo(dispatch, getState().context.projectSlug,
            getState().context.versionSlug, getState().context.docId,
            getState().context.lang)
        )
      )
  }
}

export function saveResolveConflictOriginal (latest, original) {
  return (dispatch, getState) => {
    const stateBefore = getState()
    savePhrase(latest, original)
      .then(response => {
        if (isErrorResponse(response)) {
          console.error('Failed to save phrase')
          dispatch(saveFailed(latest.id, original, response))
        } else {
          response.json().then(({ revision, status }) => {
            dispatch(saveConflictResolvedOriginal(
              latest.id, original, revision)).then(
                dispatch(fetchTransUnitHistory(
                  original.localeId,
                  latest.id,
                  stateBefore.context.projectSlug,
                  stateBefore.context.versionSlug
                )).then(
                  fetchStatisticsInfo(dispatch, getState().context.projectSlug,
                    getState().context.versionSlug, getState().context.docId,
                    getState().context.lang)
                )
              )
          })
        }
      })
  }
}

export function savePhraseWithStatus (phrase, status, reviewComment) {
  return (dispatch, getState) => {
    // save dropdowns (and others) should always close when save starts.
    dispatch(toggleDropdown(undefined))

    const stateBefore = getState()
    const saveInfo = {
      localeId: stateBefore.context.lang,
      status,
      translations: phrase.newTranslations,
      revisionComment: reviewComment,
      reviewer: stateBefore.headerData.permissions.reviewer,
      translator: stateBefore.headerData.permissions.translator
    }
    if (!saveInfo.translator && (
        saveInfo.status === STATUS_TRANSLATED ||
        saveInfo.status === STATUS_NEEDS_WORK)) {
      // User does not have required permissions to translate
      return
    }
    if (!saveInfo.reviewer && (
        saveInfo.status === STATUS_APPROVED ||
        saveInfo.status === STATUS_REJECTED)) {
      // User does not have required permissions to review
      return
    }

    const inProgressSave =
      stateBefore.phrases.detail[phrase.id].inProgressSave

    if (inProgressSave) {
      dispatch(queueSave(phrase.id, saveInfo))
      // done for now, save will initiate when inProgressSave completes
      return
    }

    doSave(saveInfo)

    /**
     * Perform a save with the given info, and recursively start next save if
     * one has queued when the save finishes.
     */
    function doSave (saveInfo) {
      // fetch a new phrase copy each time so revision and queued saves are
      // are correct.
      const currentPhrase = getState().phrases.detail[phrase.id]
      dispatch(saveInitiated(phrase.id, saveInfo))
      savePhrase(currentPhrase, saveInfo)
        .then(response => {
          if (isErrorResponse(response)) {
            console.error('Failed to save phrase')
            response.status === 409
              ? response.json().then((json) => {
                const withTime = {...saveInfo, modifiedTime: new Date()}
                dispatch(saveConflict(phrase.id, withTime, json))
              })
              : dispatch(saveFailed(phrase.id, saveInfo, response))
          } else {
            response.json().then(({ revision, status }) => {
              dispatch(saveFinished(phrase.id, status, revision)).then(
                dispatch(fetchTransUnitHistory(
                  saveInfo.localeId,
                  phrase.id,
                  stateBefore.context.projectSlug,
                  stateBefore.context.versionSlug
                )).then(
                  fetchStatisticsInfo(dispatch, getState().context.projectSlug,
                    getState().context.versionSlug, getState().context.docId,
                    getState().context.lang)
                )
              )
            })
          }
          startPendingSaveIfPresent(currentPhrase)
        })
    }

    function startPendingSaveIfPresent (currentPhrase) {
      const pendingSave = currentPhrase.pendingSave
      if (pendingSave) {
        dispatch(pendingSaveInitiated(currentPhrase.id))
        doSave(pendingSave)
      }
    }
  }
}

function isErrorResponse (response) {
  return response.status >= 400
}
