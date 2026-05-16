import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<div
			className={cn(
				"rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5",
				"card-hover",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export const CardHeader: React.FC<CardProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<div
			className={cn(
				"rounded-t-2xl border-b border-slate-200/80 bg-slate-50/80 px-6 py-4",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

export const CardContent: React.FC<CardProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<div className={cn("px-6 py-4", className)} {...props}>
			{children}
		</div>
	);
};

export const CardTitle: React.FC<CardProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<h3
			className={cn("text-lg font-semibold text-slate-950", className)}
			{...props}
		>
			{children}
		</h3>
	);
};

export const CardDescription: React.FC<CardProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<p className={cn("mt-1 text-sm text-slate-600", className)} {...props}>
			{children}
		</p>
	);
};
