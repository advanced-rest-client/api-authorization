import { html, fixture, assert, aTimeout, nextFrame } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { default as sinon } from 'sinon';
import { tap } from '@polymer/iron-test-helpers/mock-interactions.js';

import '../api-authorization.js';

describe('ApiAuthorization RAML tests', () => {

  async function basicFixture(amf, security) {
    return (await fixture(html`<api-authorization
      .amf="${amf}"
      .security="${security}"
    ></api-authorization>`));
  }

  async function modelFixture(amf, endpoint, method) {
    const security = AmfLoader.lookupSecurity(amf, endpoint, method);
    const element = await basicFixture(amf, security);
    await aTimeout();
    return element;
  }

  describe('Initialization', () => {
    it('can be initialized using web APIs', () => {
      document.createElement('api-authorization');
    });

    it('can be initialized with a template without the model', async () => {
      await basicFixture();
    });

    it('has default #selectedMethods', async () => {
      const element = await basicFixture();
      assert.equal(element.selectedMethods, null);
    });

    it('has default #selectedSchemes', async () => {
      const element = await basicFixture();
      assert.equal(element.selectedSchemes, null);
    });
  });

  describe('RAML tests', () => {
    [
      ['Full model', false],
      ['Compact model', true]
    ].forEach(([label, compact]) => {
      const fileName = 'demo-api';

      describe(`applying AMF model - ${label}`, () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        it('sets single authorization method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          assert.typeOf(element.methods, 'array', 'methods is an array');
          assert.lengthOf(element.methods, 1, 'methods has single item');
        });

        it('sets multiple authorization methods', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          assert.typeOf(element.methods, 'array', 'methods is an array');
          assert.lengthOf(element.methods, 6, 'methods has 6 items');
        });

        it('sets default selection', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          assert.equal(element.selected, 0);
        });

        it('does not render scheme selector for single method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.notOk(node);
        });

        it('renders scheme label for single method', async () => {
          const element = await modelFixture(amf, '/basic', 'get');
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.ok(node);
        });

        it('renders scheme selector for multi method', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          const node = element.shadowRoot.querySelector('anypoint-dropdown-menu');
          assert.ok(node);
        });

        it('does not render scheme label for multi method', async () => {
          const element = await modelFixture(amf, '/combo-types', 'get');
          const node = element.shadowRoot.querySelector('.auth-selector-label');
          assert.notOk(node);
        });
      });

      describe(`Basic method - ${label}`, () => {
        const username = 'uname';
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/basic', 'get');
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Basic Authentication']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['basic']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is not invalid before calling validation method', () => {
          assert.isUndefined(element.invalid);
        });

        it('element is invalid without username', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with username', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const { settings } = element;
          assert.deepEqual(settings, [{
            valid: true,
            type: 'basic',
            settings: {
              username,
              password: ''
            }
          }]);
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            authorization: 'Basic dW5hbWU6',
          }, 'has headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });

        it('ignores createAuthParams() when not valid', async () => {
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has no headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Digest method - ${label}`, () => {
        const username = 'uname';
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/digest', 'get');
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Digest Authentication']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['digest']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.username = username;
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is not invalid before calling validation method', () => {
          assert.isUndefined(element.invalid);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          element.httpMethod = 'GET';
          element.requestUrl = 'https://api.domain.com/endpoint';
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'digest', 'type is set');
          assert.typeOf(settings.settings, 'object');
          const aset = settings.settings;
          assert.equal(aset.algorithm, 'MD5', 'algorithm is set');
          assert.equal(aset.nc, '00000001', 'nc is set');
          assert.typeOf(aset.cnonce, 'string', 'cnonce is set');
          assert.typeOf(aset.response, 'string', 'response is set');
          assert.equal(aset.nonce, 'nonce', 'nonce is set');
          assert.equal(aset.opaque, 'opaque', 'opaque is set');
          assert.equal(aset.password, '', 'password is set');
          assert.equal(aset.qop, 'auth', 'qop is set');
          assert.equal(aset.realm, 'realm', 'realm is set');
          assert.equal(aset.username, username, 'username is set');
          assert.equal(aset.uri, '/endpoint', 'uri is set');
        });

        it('creates params with createAuthParams()', async () => {
          element.httpMethod = 'GET';
          element.requestUrl = 'https://api.domain.com/endpoint';
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = username;
          form.realm = 'realm';
          form.nonce = 'nonce';
          form.qop = 'auth';
          form.opaque = 'opaque';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has no headers');
          assert.deepEqual(result.params, {}, 'has no params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Digest method - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/passthrough', 'get');
        });

        afterEach(() => {
          const node = document.createElement('api-view-model-transformer');
          node.clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['Pass Through']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['passthrough']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        // This method form dispatched `changed` event (that triggers validation)
        // right after the model is loaded and form value changes. Therefore it's
        // practically always validated.
        // it('element is not invalid before calling validation method', () => {
        //   assert.isUndefined(element.invalid);
        // });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'pass through', 'type is set');
          assert.typeOf(settings.settings, 'object');
          const aset = settings.settings;
          assert.typeOf(aset.headers, 'object', 'headers is set');
          assert.typeOf(aset.queryParameters, 'object', 'queryParameters is set');
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('api_key', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            api_key: 'test',
          }, 'has headers');
          assert.deepEqual(result.params, {
            query: 'my-value'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`RAML Custom method - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/custom1', 'get');
        });

        afterEach(() => {
          const node = document.createElement('api-view-model-transformer');
          node.clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['x-my-custom']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['custom1']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const settings = element.settings[0];
          assert.isTrue(settings.valid, 'valid is true');
          assert.equal(settings.type, 'custom', 'type is set');
          assert.typeOf(settings.settings, 'object');
          const aset = settings.settings;
          assert.typeOf(aset.headers, 'object', 'headers is set');
          assert.typeOf(aset.queryParameters, 'object', 'queryParameters is set');
        });

        it('creates params with createAuthParams()', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.updateHeader('SpecialTokenHeader', 'test');
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {
            SpecialTokenHeader: 'test',
          }, 'has headers');
          assert.deepEqual(result.params, {
            booleanTokenParam: 'true'
          }, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Oauth 2 method - ${label}`, () => {
        describe('Basics', () => {
          let amf;
          let element;

          before(async () => {
            amf = await AmfLoader.load({ fileName, compact });
          });

          beforeEach(async () => {
            element = await modelFixture(amf, '/oauth2', 'post');
          });

          afterEach(() => {
            const node = document.createElement('api-view-model-transformer');
            node.clearCache();
          });

          it('has "types" in the authorization object', () => {
            const { types } = element.methods[0];
            assert.deepEqual(types, ['OAuth 2.0']);
          });

          it('has "names" in the authorization object', () => {
            const { names } = element.methods[0];
            assert.deepEqual(names, ['oauth2']);
          });

          it('has "schemes" in the authorization object', () => {
            const { schemes } = element.methods[0];
            assert.typeOf(schemes[0], 'object');
          });

          it('notifies changes when panel value change', () => {
            const form = element.shadowRoot.querySelector('api-authorization-method');
            const spy = sinon.spy();
            element.addEventListener('change', spy);
            form.clientId = 'test';
            form.dispatchEvent(new CustomEvent('change'));
            assert.isTrue(spy.called);
          });

          it('element is invalid without required values', () => {
            const result = element.validate();
            assert.isFalse(result, 'validation result is false');
            assert.isTrue(element.invalid, 'is invalid');
          });

          it('element is valid with required values', async () => {
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = 'test-client-id';
            form.accessToken = 'test-token';
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.validate();
            assert.isTrue(result, 'validation result is true');
            assert.isFalse(element.invalid, 'is not invalid');
          });

          it('produces authorization settings', async () => {
            element.redirectUri = 'https://rdr.com';
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = 'test-client-id';
            form.accessToken = 'test-token';
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const settings = element.settings[0];
            assert.isTrue(settings.valid, 'valid is true');
            assert.equal(settings.type, 'oauth 2', 'type is set');
            assert.typeOf(settings.settings, 'object');
            const aset = settings.settings;

            assert.equal(aset.type, 'implicit', 'type is set');
            assert.equal(aset.grantType, 'implicit', 'grantType is set');
            assert.equal(aset.clientId, 'test-client-id', 'clientId is set');
            assert.equal(aset.accessToken, 'test-token', 'accessToken is set');
            assert.equal(aset.tokenType, 'Bearer', 'tokenType is set');
            assert.deepEqual(aset.scopes, ['profile', 'email'], 'scopes is set');
            assert.equal(aset.deliveryMethod, 'header', 'deliveryMethod is set');
            assert.equal(aset.deliveryName, 'Authorization', 'deliveryName is set');
            assert.equal(aset.authorizationUri, 'https://auth.com', 'authorizationUri is set');
            assert.equal(aset.redirectUri, element.redirectUri, 'redirectUri is set');
          });
        });

        describe('createAuthParams()', () => {
          let amf;
          const accessToken = 'test-token';
          const clientId = 'test-client-id';

          before(async () => {
            amf = await AmfLoader.load({ fileName, compact });
          });

          it('creates params with createAuthParams()', async () => {
            const element = await modelFixture(amf, '/oauth2', 'post');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              authorization: 'Bearer ' + accessToken,
            }, 'has headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('ignores auth param in createAuthParams() when no token', async () => {
            const element = await modelFixture(amf, '/oauth2', 'post');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {}, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('respects delivery method (query)', async () => {
            const element = await modelFixture(amf, '/oauth2-query-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {}, 'has no headers');
            assert.deepEqual(result.params, {
              access_token: 'Bearer ' + accessToken,
            }, 'has params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('respects delivery method (header)', async () => {
            const element = await modelFixture(amf, '/oauth2-header-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              token: 'Bearer ' + accessToken,
            }, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });

          it('uses default delivery', async () => {
            const element = await modelFixture(amf, '/oauth2-no-delivery', 'get');
            const form = element.shadowRoot.querySelector('api-authorization-method');
            form.clientId = clientId;
            form.clientSecret = 'test';
            form.accessToken = accessToken;
            form.dispatchEvent(new CustomEvent('change'));
            await nextFrame();
            const result = element.createAuthParams();
            assert.deepEqual(result.headers, {
              authorization: 'Bearer ' + accessToken,
            }, 'has no headers');
            assert.deepEqual(result.params, {}, 'has no params');
            assert.deepEqual(result.cookies, {}, 'has no cookies');
          });
        });
      });

      describe(`OAuth 1 method - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/oauth1', 'get');
        });

        afterEach(() => {
          const node = document.createElement('api-view-model-transformer');
          node.clearCache();
        });

        it('has "types" in the authorization object', () => {
          const { types } = element.methods[0];
          assert.deepEqual(types, ['OAuth 1.0']);
        });

        it('has "names" in the authorization object', () => {
          const { names } = element.methods[0];
          assert.deepEqual(names, ['oauth1']);
        });

        it('has "schemes" in the authorization object', () => {
          const { schemes } = element.methods[0];
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.consumerKey = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('does not create params with createAuthParams()', async () => {
          const result = element.createAuthParams();
          assert.deepEqual(result.headers, {}, 'has headers');
          assert.deepEqual(result.params, {}, 'has params');
          assert.deepEqual(result.cookies, {}, 'has no cookies');
        });
      });

      describe(`Combo types - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/combo-types', 'get');
        });

        it('has all "methods"', () => {
          const { methods } = element;
          assert.lengthOf(methods, 6);
        });

        it('has "types" in all authorization objects', () => {
          assert.deepEqual(element.methods[0].types, ['Basic Authentication']);
          assert.deepEqual(element.methods[1].types, ['Digest Authentication']);
          assert.deepEqual(element.methods[2].types, ['Pass Through']);
          assert.deepEqual(element.methods[3].types, ['x-my-custom']);
          assert.deepEqual(element.methods[4].types, ['OAuth 2.0']);
          assert.deepEqual(element.methods[5].types, ['OAuth 1.0']);
        });

        it('has "names" in the authorization object', () => {
          assert.deepEqual(element.methods[0].names, ['basic']);
          assert.deepEqual(element.methods[1].names, ['digest']);
          assert.deepEqual(element.methods[2].names, ['passthroughQueryString']);
          assert.deepEqual(element.methods[3].names, ['custom1']);
          assert.deepEqual(element.methods[4].names, ['oauth2']);
          assert.deepEqual(element.methods[5].names, ['oauth1']);
        });

        it('has "schemes" in the authorization object', () => {
          assert.typeOf(element.methods[0].schemes[0], 'object');
          assert.typeOf(element.methods[1].schemes[0], 'object');
          assert.typeOf(element.methods[2].schemes[0], 'object');
          assert.typeOf(element.methods[3].schemes[0], 'object');
          assert.typeOf(element.methods[4].schemes[0], 'object');
          assert.typeOf(element.methods[5].schemes[0], 'object');
        });

        it('has default selection', () => {
          assert.equal(element.selected, 0);
        });

        it('renders selected editor type', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'basic');
        });

        it('changes editor type programaticaly', async () => {
          element.selected = 1;
          await nextFrame();
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'digest');
        });

        it('changes editor type with user interaction', async () => {
          const node = element.shadowRoot.querySelector('anypoint-item[label="custom1"]');
          tap(node);
          await nextFrame();
          const form = element.shadowRoot.querySelector('api-authorization-method');
          assert.equal(form.type, 'custom');
        });
      });

      describe(`RAML null method - ${label}`, () => {
        let amf;
        let element;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/nil-oauth2', 'get');
        });

        it('does not render authorization method', () => {
          const node = element.shadowRoot.querySelector('api-authorization-method');
          assert.notOk(node);
        });

        it('has no settings', () => {
          const { settings } = element;
          assert.deepEqual(settings, []);
        });
      });

      describe('onchange', () => {
        let element;
        let amf;

        before(async () => {
          amf = await AmfLoader.load({ fileName, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf, '/basic', 'get');
        });

        function makeChange(element) {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.username = 'test';
          form.dispatchEvent(new CustomEvent('change'));
        }

        it('Getter returns previously registered handler', () => {
          assert.isUndefined(element.onchange);
          const f = () => {};
          element.onchange = f;
          assert.isTrue(element.onchange === f);
        });

        it('Calls registered function', () => {
          let called = false;
          const f = () => {
            called = true;
          };
          element.onchange = f;
          makeChange(element);
          element.onchange = null;
          assert.isTrue(called);
        });

        it('Unregisters old function', () => {
          let called1 = false;
          let called2 = false;
          const f1 = () => {
            called1 = true;
          };
          const f2 = () => {
            called2 = true;
          };
          element.onchange = f1;
          element.onchange = f2;
          makeChange(element);
          element.onchange = null;
          assert.isFalse(called1);
          assert.isTrue(called2);
        });
      });
    });
  });
});