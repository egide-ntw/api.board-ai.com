FROM node:18.16.0-alpine

RUN apk add --no-cache bash
# Enable corepack and activate pnpm (preferred for this repo)
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate
RUN npm i -g @nestjs/cli typescript ts-node

# Use pnpm with lockfile to ensure deterministic installs
COPY package.json pnpm-lock.yaml /tmp/app/
RUN cd /tmp/app && pnpm install --frozen-lockfile

COPY . /usr/src/app
RUN cp -a /tmp/app/node_modules /usr/src/app
COPY ./wait-for-it.sh /opt/wait-for-it.sh
COPY ./startup.dev.sh /opt/startup.dev.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh
RUN sed -i 's/\r//g' /opt/startup.dev.sh

WORKDIR /usr/src/app
RUN cp .env.example .env
RUN npm run build

CMD ["/opt/startup.dev.sh"]
