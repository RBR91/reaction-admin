import React, { useState, useMemo, useCallback } from "react";
import i18next from "i18next";
import { useSnackbar } from "notistack";
import {
  Button,
  DataTable,
  useDataTable,
  useConfirmDialog
}
  from "@reactioncommerce/catalyst";
import { Box, Card, CardHeader, CardContent, makeStyles } from "@material-ui/core";
import { useApolloClient } from "@apollo/react-hooks";
import useCurrentShopId from "/imports/client/ui/hooks/useCurrentShopId";
import discountCodesQuery from "../graphql/queries/discountCodes";

const useStyles = makeStyles({
  card: {
    overflow: "visible"
  }
});

/**
 * @name DiscountCodesTable
 * @returns {React.Component} A React component
 */
function DiscountCodesTable() {
  const apolloClient = useApolloClient();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [shopId] = useCurrentShopId();

  // Create and memoize the column data
  const columns = useMemo(
    () => [
      {
        Header: i18next.t("admin.discountsTable.headers.code"),
        accessor: "code"
      },
      {
        Header: i18next.t("admin.discountsTable.headers.discount"),
        accessor: "discount"
      },
      {
        Header: i18next.t("admin.discountsTable.headers.discountMethod"),
        accessor: "calculation.method"
      },
      {
        Header: i18next.t("admin.discountsTable.headers.conditions.accountLimit"),
        accessor: "conditions.accountLimit"
      },
      {
        Header: i18next.t("admin.discountsTable.headers.conditions.redemptionLimit"),
        accessor: "conditions.redemptionLimit"
      }
    ],
    []
  );

  const onFetchData = useCallback(
    async ({ globalFilter, pageIndex, pageSize }) => {
      // Wait for shop id to be available before fetching orders.
      setIsLoading(true);
      if (!shopId) {
        return;
      }

      const { data, error } = await apolloClient.query({
        query: discountCodesQuery,
        variables: {
          shopId,
          first: pageSize,
          offset: pageIndex * pageSize,
          filters: {
            searchField: globalFilter
          }
        },
        fetchPolicy: "network-only"
      });

      if (error && error.length) {
        enqueueSnackbar(i18next.t("admin.table.error", { variant: "error" }));
        return;
      }

      // Update the state with the fetched data as an array of objects and the calculated page count
      setTableData(data.discountCodes.nodes);
      setPageCount(Math.ceil(data.discountCodes.totalCount / pageSize));

      setIsLoading(false);
    },
    [apolloClient, enqueueSnackbar, shopId]
  );

  // Create Discount form modal
  const { ConfirmDialog, openDialog } = useConfirmDialog({
    title: i18next.t("admin.discountCode.addDiscountModalTitle"),
    content: (
      <h2>Hello from the modal!</h2>
    ),
    onConfirm: () => {
      console.log("Action confirmed");
    }
  });

  // Row click callback
  const onRowClick = useCallback(() => {
    openDialog();
  }, [openDialog]);

  const labels = useMemo(
    () => ({
      globalFilterPlaceholder: i18next.t("admin.discountsTable.filterPlaceholder")
    }),
    []
  );

  const dataTableProps = useDataTable({
    columns,
    data: tableData,
    labels,
    pageCount,
    onFetchData,
    onRowClick,
    getRowId: (row) => row._id
  });


  const classes = useStyles();

  return (
    <>
      <Box marginBottom={2}>
        <Button onClick={openDialog} variant="contained" color="primary" >
          {i18next.t("admin.discountCode.addDiscount")}
        </Button>
      </Box>
      <Card className={classes.card}>
        <CardHeader title={i18next.t("admin.discounts.title", "Discount Codes")} />
        <CardContent>
          <DataTable {...dataTableProps} isLoading={isLoading} />
        </CardContent>
      </Card>
      <ConfirmDialog />
    </>

  );
}

export default DiscountCodesTable;
