import { appEnv } from '#root/core/app/env/app_env.js'
import type {
  ContentfulStatusCode,
  RedirectStatusCode,
  StatusCode,
} from 'hono/utils/http-status'
import {
  type BaseSchema,
  type BaseSchemaAsync,
  type InferInput,
  safeParseAsync,
} from 'valibot'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamPolicy } from '#root/core/teams/policies/team_policy.js'

import {
  E_OPERATION_FAILED,
  E_UNAUTHORIZED,
  E_VALIDATION_FAILED,
} from '#root/core/http/responses/errors.js'

import { FlashController } from '#root/core/shared/controllers/flash_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { Session } from '#root/core/shared/sessions/sessions.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { type Constructor, container } from '#root/core/utils/typi.js'

type ControllerParams = 'membershipId'

interface ResponseConfiguration {
  type: 'redirect' | 'json'
  payload: {
    redirect: {
      path: string
      status?: RedirectStatusCode
    }
    json: {
      status?: StatusCode
      content: Record<string, unknown>
    }
  }
}

class ResponseBuilder {
  constructor(protected ctx: HonoContext) {}

  protected forceJson?: boolean = false

  protected configuration: ResponseConfiguration = {
    type: 'json',
    payload: {
      redirect: {
        path: '',
        status: 302,
      },
      json: {
        status: 200,
        content: {},
      },
    },
  }

  redirect = <T extends RedirectStatusCode>(path: string, status?: T) => {
    this.configuration.type = 'redirect'
    this.configuration.payload.redirect = {
      path,
      status: status ?? 302,
    }

    return this
  }

  json = (
    content: ResponseConfiguration['payload']['json']['content'],
    status?: ContentfulStatusCode,
    force = false,
  ) => {
    this.configuration.type = 'json'
    this.forceJson = force
    this.configuration.payload.json = {
      content,
      status,
    }

    return this
  }

  protected isRequestAJsonSubmission = () => {
    if (this.forceJson) {
      return true
    }

    return this.ctx.req.header('Content-Type') === 'application/json'
  }

  send = () => {
    if (this.isRequestAJsonSubmission()) {
      const payload =
        this.configuration.type === 'redirect'
          ? this.configuration.payload.redirect
          : this.configuration.payload.json.content

      return this.ctx.json(
        {
          type: this.configuration.type,
          payload,
        },
        this.configuration.payload.json.status as ContentfulStatusCode,
      )
    }

    return this.ctx.redirect(
      this.configuration.payload.redirect.path,
      this.configuration.payload.redirect.status,
    )
  }
}

export class BaseController extends FlashController {
  protected session = container.make(Session)

  protected getParameter(ctx: HonoContext, param: ControllerParams) {
    const id = ctx.req.param(param)

    return id
  }

  isRequestAskingForJson(ctx: HonoContext) {
    return ctx.req.header('Accept')?.includes('application/json')
  }

  isRequestAFormSubmission(ctx: HonoContext) {
    return ctx.req.header('Content-Type') === 'application/x-www-form-urlencoded'
  }

  isRequestAJsonSubmission(ctx: HonoContext) {
    return ctx.req.header('Content-Type') === 'application/json'
  }

  async parseSubmittedDataFromRequest(ctx: HonoContext) {
    if (this.isRequestAFormSubmission(ctx)) {
      return ctx.req.parseBody()
    }

    if (this.isRequestAJsonSubmission(ctx)) {
      return ctx.req.json()
    }

    return ctx.req.json()
  }

  response(ctx: HonoContext) {
    return new ResponseBuilder(ctx)
  }

  protected async validate<
    // biome-ignore lint/suspicious/noExplicitAny: Valibot schema types require any
    T extends BaseSchema<any, any, any> | BaseSchemaAsync<any, any, any>,
  >(
    ctx: HonoContext,
    schema: T,
    extraContext?: Record<string, string>,
  ): Promise<InferInput<T>> {
    const payload = await this.parseSubmittedDataFromRequest(ctx)

    const { success, issues, output } = await safeParseAsync(schema, {
      ...payload,
      ...extraContext,
    })

    if (!success) throw E_VALIDATION_FAILED(issues)

    return output
  }

  protected getDecodedSignature(ctx: HonoContext) {
    return new SignedUrlManager(appEnv.APP_KEY).decode(ctx.req.param('signature'))
  }

  protected ensureBelongsToTeam(ctx: HonoContext, entity: { teamId: string }) {
    const team = this.ensureTeam(ctx)

    if (team.id !== entity.teamId) {
      throw E_UNAUTHORIZED('This entity does not belong to your selected team. ')
    }

    return team
  }

  protected ensureTeam(ctx: HonoContext) {
    const team = ctx.get('team')

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: 'The team is required.',
          field: 'team',
        },
      ])

    return team
  }

  protected ensureCanAdministrate(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canAdministrate = teamPolicy.canAdministrate(team, this.user(ctx)?.id)

    if (!canAdministrate) {
      throw E_UNAUTHORIZED('You are not authorised to administrate this team.')
    }

    return team
  }

  protected ensureCanManage(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canManage = teamPolicy.canManage(team, this.user(ctx)?.id)

    if (!canManage) {
      throw E_UNAUTHORIZED('You are not authorised to manage this team.')
    }

    return team
  }

  protected ensureCanAuthor(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canManage = teamPolicy.canAuthor(team, this.user(ctx)?.id)

    if (!canManage) {
      throw E_UNAUTHORIZED('You are not authorised to perform this action on this team.')
    }

    return team
  }

  protected ensureCanView(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const teamPolicy = container.make(TeamPolicy)

    const canView = teamPolicy.canView(team, this.user(ctx)?.id)

    if (!canView) {
      throw E_UNAUTHORIZED('You are not authorised to perform this action on this team.')
    }

    return team
  }

  protected user(ctx: HonoContext) {
    return ctx.get('user')
  }

  protected team(ctx: HonoContext) {
    return ctx.get('team')
  }

  protected ensureAuthorized(ctx: HonoContext, authorizedUserIds: string[]) {
    const userId = ctx.get('user')?.id

    if (!authorizedUserIds.includes(userId)) {
      throw E_UNAUTHORIZED('You are not authorized to perform this action.')
    }
  }



  protected async ensureExists<T>(ctx: HonoContext, param: ControllerParams) {
    const repositories = {
      membershipId: TeamMembershipRepository,
    } as const

    type GenericRepository = {
      findById: (id: string) => Promise<{ teamId: string; id: string }>
    }

    const repository = container.make(
      repositories[param] as unknown as Constructor<GenericRepository>,
    )

    const entity = await repository.findById(this.getParameter(ctx, param))

    if (entity?.teamId) {
      const team = this.ensureTeam(ctx)

      if (team.id !== entity.teamId) {
        throw E_UNAUTHORIZED(
          `You are not authorized to perform this action on team ${team.id} and ${param} ${entity.id}`,
        )
      }
    }

    if (!entity) {
      throw E_VALIDATION_FAILED([
        {
          message: `Invalid ${param} provided.`,
          field: param,
        },
      ])
    }

    return entity as T
  }
}
