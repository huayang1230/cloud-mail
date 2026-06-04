import { expect, test } from 'vitest'

import { extractToken, formatRecipients, htmlToText, isEmail } from '../services.js'

test('extracts login token from supported response shapes', () => {
  expect(extractToken('token-a')).toBe('token-a')
  expect(extractToken({ token: 'token-b' })).toBe('token-b')
  expect(extractToken({ Authorization: 'token-c' })).toBe('token-c')
})

test('converts html mail content to safe mobile text', () => {
  expect(htmlToText('<p>Hello&nbsp;<b>Cloud Mail</b></p><script>bad()</script>')).toBe(
    'Hello Cloud Mail',
  )
})

test('formats recipients and validates email addresses', () => {
  expect(formatRecipients('[{"address":"a@example.com"},{"address":"b@example.com"}]')).toBe(
    'a@example.com, b@example.com',
  )
  expect(isEmail('cloud@mail.yzsaas.net')).toBe(true)
  expect(isEmail('cloud-mail')).toBe(false)
})
