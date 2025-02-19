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


import Registration from '../../selectors/Registration';
import setInputField from '../setInputField';
import ActionContext from '../../context';

export default async function (this: ActionContext, fieldName: string) {
  let value, selector;
  switch (fieldName) {
    case 'First Name':
      value = this.credentials.firstName;
      selector = Registration.firstName;
      break;
    case 'Last Name':
      value = this.credentials.lastName;
      selector = Registration.lastName;
      break;
    case 'Email':
      value = this.credentials.emailAddress;
      selector = Registration.email;
      break;
    case 'another property':
      value = 'random value';
      selector = Registration.getCustomAttribute('customAttribute');
      break;
    default: 
      throw new Error(`Unknown credential "${fieldName}"`);
  }
  await setInputField('set', value, selector);

}
