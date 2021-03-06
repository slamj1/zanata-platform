/* global jest describe it expect */

import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import * as TestUtils from 'react-dom/test-utils'
import { PhraseStatusFilter } from '.'
import FilterToggle from '../FilterToggle'
import { Icon } from '../../../components'
import mockGettextCatalog from '../../../../__mocks__/mockAngularGettext'

const callback = () => {}

describe('PhraseStatusFilterTest', () => {
  it('FilterToggle markup', () => {
    const doStuff = () => {}
    const actual = ReactDOMServer.renderToStaticMarkup(
      <FilterToggle id="government-issued"
        className="soClassy"
        isChecked
        onChange={doStuff}
        title="titalic"
        count="12"
        withDot />
    )
    const expected = ReactDOMServer.renderToStaticMarkup(
      <div className="Toggle u-curved soClassy">
        <input className="Toggle-checkbox"
          type="checkbox"
          id="government-issued"
          checked
          onChange={doStuff} />
        <span className="Toggle-fakeCheckbox" />
        <label className="Toggle-label"
          htmlFor="government-issued"
          title="titalic">
          <Icon name="dot" className="n1" />
          12
          <span className="u-hiddenVisually">titalic</span>
        </label>
      </div>
    )
    expect(actual).toEqual(expected)
  })

  it('FilterToggle markup (unchecked)', () => {
    const doStuff = () => {}
    const actual = ReactDOMServer.renderToStaticMarkup(
      <FilterToggle id="government-issued"
        className="soClassy"
        isChecked={false}
        onChange={doStuff}
        title="titalic"
        count="17"
        withDot={false} />
    )
    const expected = ReactDOMServer.renderToStaticMarkup(
      <div className="Toggle u-curved soClassy">
        <input className="Toggle-checkbox"
          type="checkbox"
          id="government-issued"
          checked={false}
          onChange={doStuff} />
        <span className="Toggle-fakeCheckbox" />
        <label className="Toggle-label"
          htmlFor="government-issued"
          title="titalic">
          17
          <span className="u-hiddenVisually">titalic</span>
        </label>
      </div>
    )
    expect(actual).toEqual(expected)
  })

  it('PhraseStatusFilter markup', () => {
    const actual = ReactDOMServer.renderToStaticMarkup(
      <PhraseStatusFilter
        resetFilter={callback}
        onFilterChange={callback}
        filter={{
          all: true,
          approved: false,
          translated: true,
          needswork: false,
          rejected: true,
          untranslated: false,
          mt: false
        }}
        counts={{
          total: 1,
          approved: 2,
          translated: 3,
          needswork: 4,
          rejected: 5,
          untranslated: 6,
          mt: 1
        }}
        gettextCatalog={mockGettextCatalog} />
    )

    const expected = ReactDOMServer.renderToStaticMarkup(
      <ul className="u-listHorizontal u-sizeHeight-1">
        <li className="u-sm-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-total"
            className="u-textSecondary"
            isChecked
            title="Total Phrases"
            count={1}
            onChange={callback}
            withDot={false} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-approved"
            className="u-textHighlight"
            isChecked={false}
            title="Approved"
            count={2}
            onChange={callback} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-translated"
            className="u-textSuccess"
            isChecked
            title="Translated"
            count={3}
            onChange={callback} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-needs-work"
            className="u-textUnsure"
            isChecked={false}
            title="Needs Work"
            count={4}
            onChange={callback} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-rejected"
            className="u-textWarning"
            isChecked
            title="Rejected"
            count={5}
            onChange={callback} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-untranslated"
            className="u-textNeutral"
            isChecked={false}
            title="Untranslated"
            count={6}
            onChange={callback} />
        </li>
        <li className="u-ltemd-hidden u-sMV-1-4">
          <FilterToggle
            id="filter-phrases-mt"
            className="u-text-color-secondary"
            isChecked={false}
            onChange={callback}
            title="MT"
            count={1} />
        </li>
      </ul>
    )
    expect(actual).toEqual(expected)
  })

  it('PhraseStatusFilter events', () => {
    let filterReset = false
    const resetFilter = () => {
      filterReset = true
    }

    let filterChangeType = 'none'
    // @ts-ignore any
    const onFilterChange = statusType => {
      filterChangeType = statusType
    }

    const filterComponent = TestUtils.renderIntoDocument(
      <PhraseStatusFilter
        resetFilter={resetFilter}
        onFilterChange={onFilterChange}
        filter={{
          all: true,
          approved: false,
          translated: true,
          needswork: false,
          rejected: false,
          untranslated: true,
          mt: false
        }}
        counts={{
          total: 1,
          approved: 2,
          translated: 3,
          needswork: 4,
          rejected: 5,
          untranslated: 6,
          mt: 1
        }}
        gettextCatalog={mockGettextCatalog} />
    )
    // @ts-ignore
    const [all, _approved, _translated, needsWork, _untranslated, _mt] =
      // @ts-ignore
      TestUtils.scryRenderedDOMComponentsWithTag(filterComponent, 'input')

    // @ts-ignore
    TestUtils.Simulate.change(needsWork, {'target': {'checked': true}})

    // @ts-ignore
    expect(filterChangeType).toEqual('needswork',
      'should call filter toggle action with correct type when specific ' +
      'status is changed')

    // @ts-ignore
    TestUtils.Simulate.change(all, {'target': {'checked': true}})
    // @ts-ignore
    expect(filterReset).toEqual(true,
      'should call given reset function when total/all is changed')
  })
})
