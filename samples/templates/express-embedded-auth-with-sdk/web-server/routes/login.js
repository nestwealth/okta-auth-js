/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */


const express = require('express');
const URL = require('url').URL;
const { 
  getAuthClient, 
  handleTransaction,
  renderTemplate,
} = require('../utils');

const router = express.Router();

const getIdpSemanticClass = (type) => {
  switch (type) {
    case 'GOOGLE':
      return 'google plus';
    case 'FACEBOOK':
      return 'facebook';
    default: 
    return '';
  }
};

// entry route
router.get('/login', async (req, res) => {
  req.setFlowStates({
    entry: '/login',
    idxMethod: 'authenticate'
  });

  // Delete the idp related render logic if you only want the username and password form
  const authClient = getAuthClient(req);
  const { availableSteps } = await authClient.idx.startTransaction({ state: req.transactionId });
  const idps = availableSteps 
    ? availableSteps
      .filter(({ name }) => name === 'redirect-idp')
      .map(({ href, idp: { name }, type }) => ({
        name,
        href,
        class: getIdpSemanticClass(type),
        id: type.toLowerCase()
      }))
    : [];

  renderTemplate(req, res, 'login', { 
    action: '/login',
    hasIdps: !!idps.length,
    idps,
  });
});

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
  const authClient = getAuthClient(req);
  const transaction = await authClient.idx.authenticate({ 
    username,
    password,
  });
  handleTransaction({ req, res, next, authClient, transaction });
});

router.get('/login/callback', async (req, res, next) => {
  const { protocol, originalUrl } = req;
  const parsedUrl = new URL(protocol + '://' + req.get('host') + originalUrl);
  const { search, href } = parsedUrl;
  const authClient = getAuthClient(req);

  try {
    if (authClient.isEmailVerifyCallback(search)) {
      const { state, stateTokenExternalId } = authClient.parseEmailVerifyCallback(search);
      const transaction = await authClient.idx.authenticate({ 
        state,
        stateTokenExternalId
      });
      handleTransaction({ req, res, next, authClient, transaction });
      return;
    }

    if (authClient.isInteractionRequired(search)) {
      const error = new Error(
        'Multifactor Authentication and Social Identity Providers is not currently supported, Authentication failed.'
      );
      next(error);
      return;
    }

    // Exchange code for tokens
    await authClient.idx.handleInteractionCodeRedirect(href);
    // Redirect back to home page
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
