import {AuthorizationMethod} from '@advanced-rest-client/authorization-method';
import {AmfHelperMixin} from '@api-components/amf-helper-mixin/amf-helper-mixin';
import {CustomMethodMixin} from './CustomMethodMixin';
import {PassThroughMethodMixin} from './PassThroughMethodMixin';
import {ApiOauth1MethodMixin} from './ApiOauth1MethodMixin';
import {ApiOauth2MethodMixin} from './ApiOauth2MethodMixin';
import {ApiKeyMethodMixin} from './ApiKeyMethodMixin';
import { CSSResult, LitElement } from 'lit-element';

export const METHOD_CUSTOM: String;
export const METHOD_PASS_THROUGH: String;


export declare interface ApiAuthorizationMethod extends AmfHelperMixin, ApiKeyMethodMixin, ApiOauth2MethodMixin, ApiOauth1MethodMixin, CustomMethodMixin, PassThroughMethodMixin, LitElement {
  nonce: string;
  onchange: EventListener|null;

  new (): ApiAuthorizationMethod;
  prototype: ApiAuthorizationMethod;
}

/**
 * An element that renders various authorization methods.
 *
 * ## Development
 *
 * The element mixes in multiple mixins from `src/` directory.
 * Each mixin support an authorization method. When selection change (the `type`
 * property) a render function from corresponding mixin is called.
 */
export declare class ApiAuthorizationMethod extends AuthorizationMethod {
  get styles(): CSSResult;

  /**
   * A security model generated by the AMF parser.
   */
  security: any;
  /**
   * When set the "description" of the security definition is rendered.
   * @attribute
   */
  descriptionOpened: boolean;

  constructor();
  connectedCallback(): void;
  render(): any;
  updated(changed: Map<string, any>): void;

  /**
   * Creates a settings object with user provided data for current method.
   *
   * @returns User provided data
   */
  serialize(): any;

  /**
   * Restores previously serialized settings.
   * A method type must be selected before calling this function.
   *
   * @param settings Depends on current type.
   */
  restore(settings: any): any|null;

  /**
   * Validates current method.
   */
  validate(): boolean;
  /**
   * Toggles value of `descriptionOpened` property.
   *
   * This is a utility method for UI event handling. Use `descriptionOpened`
   * attribute directly instead of this method.
   */
  toggleDescription(): void;
  /**
   * Updates, if applicable, query parameter value.
   * This is supported for RAML's custom scheme and Pass Through
   * that operates on query parameters model which is only an internal
   * model.
   *
   * This does nothing if the query parameter has not been defined for current
   * scheme.
   *
   * @param name The name of the changed parameter
   * @param newValue A value to apply. May be empty but must be defined.
   */
  updateQueryParameter(name: string, newValue: string): void;
  /**
   * Updates, if applicable, header value.
   * This is supported for RAML's custom scheme and Pass Through
   * that operates on headers model which is only an internal model.
   *
   * This does nothing if the header has not been defined for current
   * scheme.
   *
   * @param name The name of the changed header
   * @param newValue A value to apply. May be empty but must be defined.
   */
  updateHeader(name: string, newValue: string): void;

  /**
   * Updates, if applicable, cookie value.
   * This is supported in OAS' Api Key.
   *
   * This does nothing if the cookie has not been defined for current
   * scheme.
   *
   * @param name The name of the changed cookie
   * @param newValue A value to apply. May be empty but must be defined.
   */
  updateCookie(name: string, newValue: string): void;

  _processSecurity(): void;
  __apiPropHandler(): void;
  __amfChanged(): void;
}
