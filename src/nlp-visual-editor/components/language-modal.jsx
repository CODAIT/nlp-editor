/*

Copyright 2022 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { Modal, Select, SelectItem } from 'carbon-components-react';

function LanguageModal(props) {
  const [language, setLanguage] = React.useState(props.currentLanguage);
  const languageSelectItems = [];
  for (const l in props.languages) {
    languageSelectItems.push(
      <SelectItem
        id={`${l}-selectItem`}
        key={`${l}-selectItem`}
        value={l}
        text={props.languages[l]}
      />,
    );
  }
  return (
    <Modal
      open
      primaryButtonText="OK"
      secondaryButtonText="Cancel"
      onRequestSubmit={() => {
        props.onSubmit(language);
      }}
      onRequestClose={props.onRequestClose}
    >
      <Select
        id="language-select"
        labelText="Select Language"
        onChange={(event) => {
          setLanguage(event.target.value);
        }}
        defaultValue={language}
      >
        {languageSelectItems}
      </Select>
    </Modal>
  );
}

export default LanguageModal;
