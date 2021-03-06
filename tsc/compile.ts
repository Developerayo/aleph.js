import ts from 'https://esm.sh/typescript'
import transformImportPathRewrite from './transform-import-path-rewrite.ts'
import transformReactJsx from './transform-react-jsx.ts'
import transformReactRefresh from './transform-react-refresh.ts'
import transformReactUseDenoHook from './transform-react-use-deno-hook.ts'
import { CreatePlainTransformer, CreateTransformer } from './transformer.ts'

export interface CompileOptions {
    mode: 'development' | 'production'
    target: string
    reactRefresh: boolean
    rewriteImportPath: (importPath: string, async?: boolean) => string
    signUseDeno: (id: string) => string
}

export function createSourceFile(fileName: string, source: string) {
    return ts.createSourceFile(
        fileName,
        source,
        ts.ScriptTarget.ES2015,
    )
}

const allowTargets = [
    'esnext',
    'es2015',
    'es2016',
    'es2017',
    'es2018',
    'es2019',
    'es2020',
]

export function compile(fileName: string, source: string, { mode, target: targetName, rewriteImportPath, reactRefresh, signUseDeno }: CompileOptions) {
    const target = allowTargets.indexOf(targetName.toLowerCase())
    const transformers: ts.CustomTransformers = { before: [], after: [] }
    transformers.before!.push(CreatePlainTransformer(transformReactJsx, { mode, rewriteImportPath }))
    transformers.before!.push(CreateTransformer(transformReactUseDenoHook, signUseDeno))
    if (reactRefresh) {
        transformers.before!.push(CreateTransformer(transformReactRefresh))
    }
    transformers.after!.push(CreatePlainTransformer(transformImportPathRewrite, rewriteImportPath))

    return ts.transpileModule(source, {
        fileName,
        reportDiagnostics: true,
        compilerOptions: {
            target: target < 0 ? ts.ScriptTarget.ES2015 : (target > 0 ? target + 1 : 99),
            module: ts.ModuleKind.ES2020,
            isolatedModules: true,
            allowJs: true,
            jsx: ts.JsxEmit.React,
            experimentalDecorators: true,
            importHelpers: true,
            importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
            alwaysStrict: true,
            sourceMap: true,
            inlineSources: true,
        },
        transformers,
    })
}
