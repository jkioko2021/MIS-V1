<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Finance.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="RECEIPTING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Name" Value="N" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Cashier" Value="C" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Invoice_No" Value="I" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadComboBox ID="cbo_1" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="To_Cashier_dt" 
                                                                        FilterControlAltText="Filter To_Cashier_dt column" HeaderText="Date" 
                                                                        SortExpression="To_Cashier_dt" UniqueName="To_Cashier_dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="eOx_Invoice_No" 
                                                                        FilterControlAltText="Filter eOx_Invoice_No column" HeaderText="Invoice_No" 
                                                                        SortExpression="eOx_Invoice_No" UniqueName="eOx_Invoice_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Updated_By" 
                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="BRANCH_NAME" 
                                                                        FilterControlAltText="Filter BRANCH_NAME column" HeaderText="BRANCH_NAME" 
                                                                        SortExpression="BRANCH_NAME" UniqueName="BRANCH_NAME">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Product" 
                                                                        FilterControlAltText="Filter Product column" HeaderText="Product" 
                                                                        SortExpression="Product" UniqueName="Product">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Syst" 
                                                                        FilterControlAltText="Filter Syst column" HeaderText="System" 
                                                                        SortExpression="Syst" UniqueName="Syst">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Walk_In_Client" 
                                                                        FilterControlAltText="Filter Walk_In_Client column" HeaderText="Walk_In" 
                                                                        SortExpression="Walk_In_Client" UniqueName="Walk_In_Client">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Entered_By" 
                                                                        FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                        SortExpression="Entered_By" UniqueName="Entered_By">
                                                                    </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Is_Branch" 
        FilterControlAltText="Filter Is_Branch column" HeaderText="Branch" 
        SortExpression="Is_Branch" UniqueName="Is_Branch">
    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label159" runat="server" Text="Payment Status"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel32" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GD_Pay" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="20" Skin="Web20" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Premium" DataFormatString="{0:### ##0.0}" 
                                                                        FilterControlAltText="Filter Premium column" HeaderText="Premium" 
                                                                        SortExpression="Premium" UniqueName="Premium">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Paid_Amt" DataFormatString="{0:### ##0.0}" 
                                                                        FilterControlAltText="Filter Paid_Amt column" HeaderText="Paid_Amt" 
                                                                        SortExpression="Paid_Amt" UniqueName="Paid_Amt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Pay_Ref_No" 
                                                                        FilterControlAltText="Filter Pay_Ref_No column" HeaderText="Pay_Ref_No" 
                                                                        SortExpression="Pay_Ref_No" UniqueName="Pay_Ref_No">
                                                                    </telerik:GridBoundColumn>
                                                                                                                                                                                                           
                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="File_Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label173" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                    <telerik:RadNumericTextBox ID="txtpaid" Runat="server" Culture="en-US" 
                                                        Skin="Web20" Value="0" Width="200px">
                                                    </telerik:RadNumericTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Label ID="Label174" runat="server" Font-Bold="True" Text="ONLINE PRODUCTS"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel4" runat="server">
                                                        <table style="width: 99%">
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label178" runat="server" Font-Bold="True" Text="Proposer"></asp:Label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel36" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="1128px">
                                                                        <telerik:RadGrid ID="GD_PROPOSER" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                                            Width="100%">
                                                                            <MasterTableView AutoGenerateColumns="False">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                    <telerik:GridBoundColumn DataField="code" 
                                                                                        FilterControlAltText="Filter code column" HeaderText="File_No" 
                                                                                        SortExpression="code" UniqueName="code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="proposer" 
                                                                                        FilterControlAltText="Filter proposer column" HeaderText="proposer" 
                                                                                        SortExpression="proposer" UniqueName="proposer">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="cover_type" 
                                                                                        FilterControlAltText="Filter cover_type column" HeaderText="cover_type" 
                                                                                        SortExpression="cover_type" UniqueName="cover_type">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="family_size" 
                                                                                        FilterControlAltText="Filter family_size column" HeaderText="family_size" 
                                                                                        SortExpression="family_size" UniqueName="family_size">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="plan_name" 
                                                                                        FilterControlAltText="Filter plan_name column" HeaderText="plan_name" 
                                                                                        SortExpression="plan_name" UniqueName="plan_name">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="plan_limit" 
                                                                                        DataFormatString="{0:###.##0.0}" 
                                                                                        FilterControlAltText="Filter plan_limit column" HeaderText="plan_limit" 
                                                                                        SortExpression="plan_limit" UniqueName="plan_limit">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="age_band" 
                                                                                        FilterControlAltText="Filter age_band column" HeaderText="age_band" 
                                                                                        SortExpression="age_band" UniqueName="age_band">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="premium_amount" 
                                                                                        DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter premium_amount column" HeaderText="premium" 
                                                                                        SortExpression="premium_amount" UniqueName="premium_amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="levy_vat" 
                                                                                        FilterControlAltText="Filter levy_vat column" HeaderText="levy_vat" 
                                                                                        SortExpression="levy_vat" UniqueName="levy_vat">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="levy_ext" 
                                                                                        FilterControlAltText="Filter levy_ext column" HeaderText="levy_ext" 
                                                                                        SortExpression="levy_ext" UniqueName="levy_ext">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="stamp_duty" 
                                                                                        FilterControlAltText="Filter stamp_duty column" HeaderText="stamp_duty" 
                                                                                        SortExpression="stamp_duty" UniqueName="stamp_duty">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="total_amount" 
                                                                                        DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter total_amount column" HeaderText="total_amount" 
                                                                                        SortExpression="total_amount" UniqueName="total_amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="agent" 
                                                                                        FilterControlAltText="Filter agent column" HeaderText="agent" 
                                                                                        SortExpression="agent" UniqueName="agent">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="proposer_dob" 
                                                                                        FilterControlAltText="Filter proposer_dob column" HeaderText="proposer_dob" 
                                                                                        SortExpression="proposer_dob" UniqueName="proposer_dob">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="application_date" 
                                                                                        FilterControlAltText="Filter application_date column" 
                                                                                        HeaderText="application_date" SortExpression="application_date" 
                                                                                        UniqueName="application_date">
                                                                                    </telerik:GridBoundColumn>
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <ItemStyle Wrap="False" />
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label179" runat="server" Font-Bold="True" Text="Payment"></asp:Label>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel37" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="1128px">
                                                                        <telerik:RadGrid ID="GD_Online_Pay" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                                            Width="100%">
                                                                            <MasterTableView AutoGenerateColumns="False">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                    <telerik:GridBoundColumn DataField="code" 
                                                                                        FilterControlAltText="Filter code column" HeaderText="File_No" 
                                                                                        SortExpression="code" UniqueName="code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_code" 
                                                                                        FilterControlAltText="Filter payment_code column" HeaderText="payment_code" 
                                                                                        SortExpression="payment_code" UniqueName="payment_code">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="amount" DataFormatString="{0:### ##0.0}" 
                                                                                        FilterControlAltText="Filter amount column" HeaderText="Paid_Amt" 
                                                                                        SortExpression="amount" UniqueName="amount">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_method" 
                                                                                        FilterControlAltText="Filter payment_method column" HeaderText="payment_method" 
                                                                                        SortExpression="payment_method" UniqueName="payment_method">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="payment_date" 
                                                                                        FilterControlAltText="Filter payment_date column" HeaderText="payment_date" 
                                                                                        SortExpression="payment_date" UniqueName="payment_date">
                                                                                    </telerik:GridBoundColumn>
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <ItemStyle Wrap="False" />
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <asp:Label ID="Label3" runat="server" Text="Total Paid Amt:"></asp:Label>
                                                                    &nbsp;<telerik:RadNumericTextBox ID="RadNumericTextBox1" Runat="server" 
                                                                        Culture="en-US" Skin="Web20" Value="0" Width="200px">
                                                                    </telerik:RadNumericTextBox>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    &nbsp;</td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel2" runat="server">
                                            <table style="width: 99%">
                                                <tr>
                                                    <td>
                                                        <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="1100px">
                                                            <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </RowIndicatorColumn>
                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                        <HeaderStyle Width="20px" />
                                                                    </ExpandCollapseColumn>
                                                                    <Columns>
                                                                        <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                            FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                            SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                            SortExpression="File_No" UniqueName="File_No">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                            FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                            SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                            FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                            SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="File_Name" 
                                                                            FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                            SortExpression="File_Name" UniqueName="File_Name">
                                                                        </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Doc_Ref" 
                                                                                    FilterControlAltText="Filter Doc_Ref column" HeaderText="Doc_Ref" 
                                                                                    SortExpression="Doc_Ref" UniqueName="Doc_Ref">
                                                                                </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Upload_By" 
                                                                            FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                            SortExpression="Upload_By" UniqueName="Upload_By">
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                            SortExpression="DOC_ID">
                    <ItemTemplate>
                  <asp:LinkButton ID="lnkDownload" runat="server" Text="Download" OnClick="DownloadFile"
                    CommandArgument='<%# Eval("DOC_ID") %>'></asp:LinkButton>
                  </ItemTemplate>
                                                                        </telerik:GridTemplateColumn>
                                                                    </Columns>
                                                                    <EditFormSettings>
                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                        </EditColumn>
                                                                    </EditFormSettings>
                                                                </MasterTableView>
                                                                <FilterMenu EnableImageSprites="False">
                                                                </FilterMenu>
                                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                </HeaderContextMenu>
                                                            </telerik:RadGrid>
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                            ScrollBars="Horizontal" Width="1071px">
                                                            <asp:Literal ID="ltEmbed" runat="server" />
                                                        </asp:Panel>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 17px;">
                                                        <asp:Label ID="txtproposer" runat="server" Font-Bold="True"></asp:Label>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <table style="width: 100%">
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label158" runat="server" Text="Attach Receipt"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="250px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label153" runat="server" Text="Invoice No"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtinv" Runat="server" Enabled="False" Skin="Web20" 
                                                        Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label156" runat="server" Text="Receipt No"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtreceipt" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td style="width: 246px">
                                                    <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload">
                                                    </telerik:RadButton>
                                                    <asp:Label ID="UPLOAD" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <hr />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label157" runat="server" Text="Payment Status"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cbopayment" Runat="server" MarkFirstMatch="True" 
                                                        Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="FULL-PAID" 
                                                                Value="FULL-PAID" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="PART-PAID" 
                                                                Value="PART-PAID" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cbopayment" Text="NOT-PAID" 
                                                                Value="NOT-PAID" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label169" runat="server" Text="Cheque/EFT No/Mpesa"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadTextBox ID="txtrefno" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label150" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <telerik:RadComboBox ID="cboAction" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Receipted" Value="M" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Incomplete Return to Mship" 
                                                                Value="RM" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" 
                                                                Text="Incomplete Return to RM " Value="RI" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Credit Control" Value="CC" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td>
                                                    <asp:Label ID="Label172" runat="server" Text="Amt To Receipt"></asp:Label>
                                                </td>
                                                <td>
                                                    <telerik:RadNumericTextBox ID="txtreceiptamt" Runat="server" Culture="en-US" 
                                                        Skin="Web20" Value="0" Width="200px">
                                                    </telerik:RadNumericTextBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label155" runat="server" Text="updated by"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblupdateby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label154" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                                <td>
                                                    <asp:Label ID="lblbus" runat="server"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                                </td>
                                                <td rowspan="2">
                                                    <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Web20" 
                                                        TextMode="MultiLine" Width="450px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px">
                                                    &nbsp;</td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; height: 38px;">
                                                </td>
                                                <td style="height: 38px;">
                                                    <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                                        Width="200px">
                                                    </telerik:RadButton>
                                                </td>
                                                <td colspan="2" style="height: 38px">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" ForeColor="Red" 
                                            Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1100px">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
                 <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
            </asp:UpdatePanel>
</asp:Content>