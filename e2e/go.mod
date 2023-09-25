module github.com/basemind-ai/monorepo/e2e

go 1.21

require github.com/spf13/cobra v1.7.0

require (
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
)

replace (
	github.com/basemind-ai/monorepo v0.0.0 => ../
)
