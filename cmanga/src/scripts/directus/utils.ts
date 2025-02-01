import config from "@/config";
import {
  createDirectus,
  authentication,
  rest,
  readSingleton,
  updateItem,
  AuthenticationClient,
  DirectusClient,
  RestClient,
} from "@directus/sdk";

const directusClient = createDirectus(config.DIRECTUS_URL)
  .with(authentication())
  .with(rest());

const productDirectusClient = createDirectus(config.PRODUCTION_DIRECTUS_URL)
  .with(authentication())
  .with(rest());

export const getAuthenticatedClient = async () => {
  const { access_token } = await directusClient.login(
    config.DIRECTUS_ADMIN_EMAIL,
    config.DIRECTUS_ADMIN_PASSWORD
  );

  directusClient.setToken(access_token);

  return directusClient;
};

export const getProductAuthenticatedClient = async () => {
  const { access_token } = await productDirectusClient.login(
    config.PRODUCTION_DIRECTUS_ADMIN_EMAIL,
    config.PRODUCTION_DIRECTUS_ADMIN_PASSWORD
  );

  productDirectusClient.setToken(access_token);

  return productDirectusClient;
};

export const mapMultiple = async (
  data: {
    from: { source: string; sourceId: string };
    to: { source: string; sourceId: string };
    exact: boolean;
  }[]
) => {
  const client = await getAuthenticatedClient();

  return await Promise.all(data.map((d) => map({ ...d }, client)));
};

export const map = async (
  data: {
    from: { source: string; sourceId: string };
    to: { source: string; sourceId: string };
    exact: boolean;
  },
  client?: DirectusClient<any> & AuthenticationClient<any> & RestClient<any>
) => {
  const { from, to, exact = true } = data;
  if (!client) client = await getAuthenticatedClient();

  const fromVariant = (
    await client.request(
      readSingleton("title_variant", {
        filter: {
          _and: [
            { source_id: { _eq: from.sourceId } },
            { source: { _eq: from.source } },
            { status: { _eq: "published" } },
            { title: { _null: false } },
          ],
        },
      })
    )
  )[0];

  if (!fromVariant) {
    console.error(
      `Not found unmapped from variant ${from.source} ${from.sourceId}`
    );
    return;
  }

  const toVariant = (
    await client.request(
      readSingleton("title_variant", {
        filter: {
          _and: [
            { source_id: { _eq: from.sourceId } },
            { source: { _eq: from.source } },
            {
              _or: [
                {
                  _and: [
                    { status: { _eq: "published" } },
                    { title: { _null: true } },
                  ],
                },
                { status: { _eq: "draft" } },
              ],
            },
          ],
        },
      })
    )
  )[0];

  if (!toVariant) {
    console.error(`Not found to variant ${to.source} ${to.sourceId}`);
    return;
  }

  return await client.request(
    updateItem("title_variant", toVariant.id, {
      title: fromVariant.title,
      status: exact ? "published" : "draft",
    })
  );
};
