<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_Review.aspx.vb" Inherits="_Default" %>

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
                                            Text="RISK SIGNOFF" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Id">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                        Text="Select" UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="Depart_Code" 
                                                                        FilterControlAltText="Filter Depart_Code column" 
                                                                        HeaderText="Depart_Code" SortExpression="Depart_Code" 
                                                                        UniqueName="Depart_Code">
                                                                    </telerik:GridBoundColumn>                                                                      
                                                                    <telerik:GridBoundColumn DataField="Period_From" 
                                                                        FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                                        SortExpression="Period_From" UniqueName="Period_From">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Period_To" 
                                                                        FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                                        SortExpression="Period_To" UniqueName="Period_To">
                                                                    </telerik:GridBoundColumn>

                                                                     <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Risk_Owner" 
                                                                        FilterControlAltText="Filter Risk_Owner column" HeaderText="Risk_Owner" 
                                                                        SortExpression="Risk_Owner" UniqueName="Risk_Owner">
                                                                    </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Champion_Name" 
                                                                        FilterControlAltText="Filter Champion_Name column" HeaderText="Champion_Name" 
                                                                        SortExpression="Champion_Name" UniqueName="Champion_Name">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Status" 
                                                                        FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                                        SortExpression="Status" UniqueName="Status">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Due_Date" 
                                                                        FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                        SortExpression="Due_Date" UniqueName="Due_Date">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Small" 
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
                                                <td colspan="3">
                                                    <asp:Label ID="Label1" runat="server" style="font-weight: 700" 
                                                        Text="RISK SUMMARY"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel29" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GD_RISK_SUM" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" Skin="Simple" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Title_Reference" 
                                                                        FilterControlAltText="Filter Title_Reference column" 
                                                                        HeaderText="Title_Reference" SortExpression="Title_Reference" 
                                                                        UniqueName="Title_Reference">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Impact" 
                                                                        FilterControlAltText="Filter Impact column" HeaderText="Impact" 
                                                                        SortExpression="Impact" UniqueName="Impact">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Likelihood" 
                                                                        FilterControlAltText="Filter Likelihood column" HeaderText="Likelihood" 
                                                                        SortExpression="Likelihood" UniqueName="Likelihood">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                        FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                        HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                        UniqueName="Inh_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                        FilterControlAltText="Filter Control_Eff  column" HeaderText="Control_Eff" 
                                                                        SortExpression="Control_Eff" UniqueName="Control_Eff">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                        FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                        HeaderText="R_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                        UniqueName="R_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="Label196" runat="server" style="font-weight: 700" 
                                                        Text="RISK REGISTER"></asp:Label>
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
                                                    <asp:Panel ID="Panel17" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GD_RISK" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Risk_Id">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                  <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter POLICY_CODE column" HeaderText="Select" 
                                                                        Text="Select" UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Id" 
                                                                        FilterControlAltText="Filter Risk_Id column" HeaderText="Risk_Id" 
                                                                        SortExpression="Risk_Id" UniqueName="Risk_Id">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                        FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                        SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Depart_Objective" 
                                                                        FilterControlAltText="Filter Depart_Objective column" HeaderText="Objective" 
                                                                        SortExpression="Depart_Objective" UniqueName="Depart_Objective">
                                                                    </telerik:GridBoundColumn>                                                                                                                                     
                                                                     <telerik:GridBoundColumn DataField="Risk_Category" 
                                                                        FilterControlAltText="Filter Risk_Category column" HeaderText="Risk_Category" 
                                                                        SortExpression="Risk_Category" UniqueName="Risk_Category">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Risk_Impact" 
                                                                        FilterControlAltText="Filter Risk_Impact column" HeaderText="Impact" 
                                                                        SortExpression="Risk_Impact" UniqueName="Risk_Impact">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Risk_Likelihood" 
                                                                        FilterControlAltText="Filter Risk_Likelihood column" HeaderText="Likelihood" 
                                                                        SortExpression="Risk_Likelihood" UniqueName="Risk_Likelihood">
                                                                    </telerik:GridBoundColumn>
                                                                 
                                                                  
                                                                    
                                                                    <telerik:GridBoundColumn DataField="Due_Date" 
                                                                        DataFormatString="{0:yyyy-MM-dd}" 
                                                                        FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                        SortExpression="Due_Date" UniqueName="Due_Date">
                                                                    </telerik:GridBoundColumn>
                                                                         <telerik:GridBoundColumn DataField="Action_Status" 
                                                                        FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                        SortExpression="Action_Status" UniqueName="Action_Status">
                                                                    </telerik:GridBoundColumn>
                                                                                                                               
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel19" runat="server">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td colspan="2">
                                                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" SelectedIndex="0" 
                                                            MultiPageID="RadMultiPage1">
                                                            <Tabs>
                                                                <telerik:RadTab runat="server" PageViewID="V1" Text="Risk Details" 
                                                                    Selected="True">
                                                                </telerik:RadTab>
                                                                <telerik:RadTab runat="server" PageViewID="V3" Text="Inherent Risk">
                                                                </telerik:RadTab>
                                                                <telerik:RadTab runat="server" PageViewID="V2" 
                                                                    Text="Root Cause">
                                                                </telerik:RadTab>
                                                                <telerik:RadTab runat="server" PageViewID="V4" Text="Residual Risk">
                                                                </telerik:RadTab>
                                                            </Tabs>
                                                        </telerik:RadTabStrip>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2">
                                                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="100%">
                                                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                                <asp:Panel ID="Panel23" runat="server">
                                                                    <table style="width: 100%">
                                                                        <tr>
                                                                            <td colspan="4" bgcolor="#999999">
                                                                                <asp:Label ID="Label186" runat="server" Font-Bold="True" Text="RISK DETAILS"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px; height: 19px;">
                                                                                <asp:Label ID="Label187" runat="server" Text="Risk owner"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%; height: 19px;">
                                                                                <telerik:RadComboBox ID="cboowner" Runat="server" Enabled="False" Skin="Sunset" 
                                                                                    Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                            <td style="width: 3%; height: 19px;">
                                                                                </td>
                                                                            <td style="width: 3%; height: 19px;">
                                                                                </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label182" runat="server" Text="Period From"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%">
                                                                                <telerik:RadDatePicker ID="dtfrom" Runat="server" Enabled="False" MinDate="" 
                                                                                    Skin="Sunset">
                                                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                    </Calendar>
                                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                    </DateInput>
                                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                </telerik:RadDatePicker>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                <asp:Label ID="LBLRISK" runat="server"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label183" runat="server" Text="Period To"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%">
                                                                                <telerik:RadDatePicker ID="dtto" Runat="server" Enabled="False" MinDate="" 
                                                                                    Skin="Sunset">
                                                                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                    </Calendar>
                                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                    </DateInput>
                                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                </telerik:RadDatePicker>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label164" runat="server" Text="Depart Objective"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%">
                                                                                <telerik:RadComboBox ID="cboobjective" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label166" runat="server" Text="Risk category"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%">
                                                                                <telerik:RadComboBox ID="cbocategory" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label165" runat="server" Text="Risk Title"></asp:Label>
                                                                            </td>
                                                                            <td style="width: 72%">
                                                                                <telerik:RadTextBox ID="txttitle" Runat="server" Width="400px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label167" runat="server" Text="Risk Description"></asp:Label>
                                                                            </td>
                                                                            <td rowspan="2" style="width: 72%">
                                                                                <telerik:RadTextBox ID="txtdescr" Runat="server" Height="70px" Rows="3" 
                                                                                    Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                <asp:Label ID="Label169" runat="server" Text="Consequences"></asp:Label>
                                                                            </td>
                                                                            <td rowspan="2" style="width: 72%">
                                                                                <telerik:RadTextBox ID="txtconseq" Runat="server" Height="100px" Rows="3" 
                                                                                    Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td class="style17" style="width: 364px">
                                                                                &nbsp;</td>
                                                                            <td style="width: 72%">
                                                                                <asp:CheckBox ID="chkactive" runat="server" Text="Is Active" />
                                                                                &nbsp;<telerik:RadButton ID="btnedit" runat="server" Skin="Simple" Text="Edit" 
                                                                                    Width="100px">
                                                                                </telerik:RadButton>
                                                                            </td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                            <td style="width: 3%">
                                                                                &nbsp;</td>
                                                                        </tr>
                                                                    </table>
                                                                </asp:Panel>
                                                                </telerik:RadPageView>
                                                                  <telerik:RadPageView ID="V2" runat="server">
                                                                      <asp:Panel ID="Panel27" runat="server" Height="100%">
                                                                          <table style="width: 100%">
                                                                              <tr>
                                                                                  <td bgcolor="#999999">
                                                                                      <asp:Label ID="Label191" runat="server" Font-Bold="True" Text="ROOT CAUSE"></asp:Label>
                                                                                  </td>
                                                                              </tr>
                                                                              <tr>
                                                                                  <td>
                                                                                      <asp:Panel ID="Panel28" runat="server">
                                                                                          <table style="width: 100%">
                                                                                              <tr>
                                                                                                  <td class="style17" colspan="2">
                                                                                                      <asp:Panel ID="Panel26" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                          Width="1142px">
                                                                                                          <telerik:RadGrid ID="GD_RISK_ROOT" runat="server" AllowPaging="True" 
                                                                                                              CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                                              Width="100%">
                                                                                                              <MasterTableView AutoGenerateColumns="False" DataKeyNames="Root_ID">
                                                                                                                  <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                                  <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                                  <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                                      <HeaderStyle Width="20px" />
                                                                                                                  </RowIndicatorColumn>
                                                                                                                  <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                                      <HeaderStyle Width="20px" />
                                                                                                                  </ExpandCollapseColumn>
                                                                                                                  <Columns>
                                                                                                                      <telerik:GridButtonColumn CommandName="Select" 
                                                                                                                          FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                                                                                          UniqueName="Select">
                                                                                                                          <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                                                                          <ItemStyle Width="50px" />
                                                                                                                      </telerik:GridButtonColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Root_ID" 
                                                                                                                          FilterControlAltText="Filter Root_ID column" HeaderText="Root_ID" 
                                                                                                                          SortExpression="Root_ID" UniqueName="Root_ID">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Risk_Code" 
                                                                                                                          FilterControlAltText="Filter Risk_Code column" HeaderText="Risk_Code" 
                                                                                                                          SortExpression="Risk_Code" UniqueName="Risk_Code">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Root_Cause" 
                                                                                                                          FilterControlAltText="Filter Root_Cause column" HeaderText="Root_Cause" 
                                                                                                                          SortExpression="Root_Cause" UniqueName="Root_Cause">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Current_Contr" 
                                                                                                                          FilterControlAltText="Filter Current_Contr column" HeaderText="Current_Control" 
                                                                                                                          SortExpression="Current_Contr" UniqueName="Current_Contr">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Mitigations" 
                                                                                                                          FilterControlAltText="Filter Mitigations column" HeaderText="Mitigations" 
                                                                                                                          SortExpression="Mitigations" UniqueName="Mitigations">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Due_Date" 
                                                                                                                          FilterControlAltText="Filter Due_Date  column" HeaderText="Due_Date" 
                                                                                                                          SortExpression="Due_Date" UniqueName="Due_Date">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Action_Owner" 
                                                                                                                          FilterControlAltText="Filter Action_Owner column" HeaderText="Action_Owner" 
                                                                                                                          SortExpression="Action_Owner" UniqueName="Action_Owner">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridBoundColumn DataField="Action_Status" 
                                                                                                                          FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                                                                          SortExpression="Action_Status" UniqueName="Action_Status">
                                                                                                                      </telerik:GridBoundColumn>
                                                                                                                      <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                                          ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                                          Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                                          <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                                          <ItemStyle CssClass="ButtonColumn" />
                                                                                                                      </telerik:GridButtonColumn>
                                                                                                                  </Columns>
                                                                                                                  <EditFormSettings>
                                                                                                                      <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                                      </EditColumn>
                                                                                                                  </EditFormSettings>
                                                                                                              </MasterTableView>
                                                                                                              <ItemStyle Wrap="False" />
                                                                                                              <PagerStyle Wrap="False" />
                                                                                                              <FilterMenu EnableImageSprites="False">
                                                                                                              </FilterMenu>
                                                                                                              <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                              </HeaderContextMenu>
                                                                                                          </telerik:RadGrid>
                                                                                                      </asp:Panel>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:Label ID="Label192" runat="server" Text="Root cause"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadTextBox ID="txtroot" Runat="server" Height="100px" Rows="3" 
                                                                                                          Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                                      </telerik:RadTextBox>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:Label ID="Label193" runat="server" Text="Current Controls"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadTextBox ID="txtcurrcont" Runat="server" Height="100px" Rows="3" 
                                                                                                          Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                                      </telerik:RadTextBox>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:Label ID="Label194" runat="server" Text="Mitigating action"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadTextBox ID="txtmitigation" Runat="server" Height="100px" Rows="3" 
                                                                                                          Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                                      </telerik:RadTextBox>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:Label ID="Label178" runat="server" Text="Resolution Due date"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadDatePicker ID="dtduedate" Runat="server" Height="24px" MinDate="" 
                                                                                                          Skin="Sunset">
                                                                                                          <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                                              UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                                          </Calendar>
                                                                                                          <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy" Height="24px">
                                                                                                          </DateInput>
                                                                                                          <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                                      </telerik:RadDatePicker>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:Label ID="Label180" runat="server" Text="Action owner"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadTextBox ID="txtowner" Runat="server" Width="250px">
                                                                                                      </telerik:RadTextBox>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="height: 22px; width: 120px">
                                                                                                      <asp:Label ID="Label181" runat="server" Text="Action Status"></asp:Label>
                                                                                                  </td>
                                                                                                  <td style="height: 22px">
                                                                                                      <telerik:RadComboBox ID="cbostatus" Runat="server" Skin="Sunset" Width="250px" 
                                                                                                          AutoPostBack="True">
                                                                                                      </telerik:RadComboBox>
                                                                                                      &nbsp;<asp:Label ID="lblst" runat="server" Font-Size="Small"></asp:Label>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      <asp:HiddenField ID="HiddenField2" runat="server" />
                                                                                                      <asp:Label ID="rootid" runat="server"></asp:Label>
                                                                                                  </td>
                                                                                                  <td>
                                                                                                      <telerik:RadButton ID="RadButton2" runat="server" Skin="Simple" 
                                                                                                          Text="Save Root" Width="100px">
                                                                                                      </telerik:RadButton>
                                                                                                      &nbsp;<asp:Label ID="lblroot" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                                          ForeColor="Red"></asp:Label>
                                                                                                  </td>
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td style="width: 120px">
                                                                                                      &nbsp;</td>
                                                                                                  <td>
                                                                                                      &nbsp;</td>
                                                                                              </tr>
                                                                                          </table>
                                                                                      </asp:Panel>
                                                                                  </td>
                                                                              </tr>
                                                                          </table>
                                                                      </asp:Panel>
                                                                </telerik:RadPageView>
                                                                 <telerik:RadPageView ID="V3" runat="server">
                                                                <asp:Panel ID="Panel3" runat="server">
                                                                    <table style="width: 100%">
                                                                        <tr>
                                                                            <td colspan="2" bgcolor="#999999">
                                                                                <asp:Label ID="Label188" runat="server" Text="INHERENT RISK EXPOSURES"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 197px">
                                                                                <asp:Label ID="Label170" runat="server" Text="Impact"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadComboBox ID="cboimpact" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 197px">
                                                                                <asp:Label ID="Label171" runat="server" Text="Likelihood"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadComboBox ID="cbolikely" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </asp:Panel>
                                                                </telerik:RadPageView>
                                                                 <telerik:RadPageView ID="V4" runat="server">
                                                                <asp:Panel ID="Panel4" runat="server">
                                                                    <table style="width: 100%">
                                                                        <tr>
                                                                            <td colspan="2" bgcolor="#999999">
                                                                                <asp:Label ID="Label190" runat="server" Text="RESIDUAL RISK EXPOSURES"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 194px">
                                                                                <asp:Label ID="Label174" runat="server" Text="Perceived control"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadComboBox ID="cbopercieved" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 194px">
                                                                                <asp:Label ID="Label175" runat="server" Text="Desired control"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadComboBox ID="cbodesired" Runat="server" AllowCustomText="True" 
                                                                                    MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                                </telerik:RadComboBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 194px">
                                                                                <asp:Label ID="Label195" runat="server" Text="Notes"></asp:Label>
                                                                            </td>
                                                                            <td>
                                                                                <telerik:RadTextBox ID="txtnotes" Runat="server" Height="50px" Rows="3" 
                                                                                    Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                                </telerik:RadTextBox>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td style="width: 194px; height: 25px;">
                                                                            </td>
                                                                            <td style="height: 25px">
                                                                                <telerik:RadButton ID="RadButton3" runat="server" Skin="Simple" 
                                                                                    Text="Update Risk" Width="100px">
                                                                                </telerik:RadButton>
                                                                                &nbsp;<asp:Label ID="lblsave" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                    ForeColor="Red"></asp:Label>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </asp:Panel>
                                                                </telerik:RadPageView>
                                                        </telerik:RadMultiPage>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2">
                                                        <hr />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="Gray" colspan="2">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2">
                                                        <hr />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" colspan="2">
                                                        <asp:Label ID="Label184" runat="server" Text="Forward"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="width: 954px; height: 32px;">
                                                        <telerik:RadComboBox ID="cbocompl" Runat="server" Skin="Sunset" Width="200px">
                                                            <Items>
                                                                <telerik:RadComboBoxItem runat="server" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Complete" Value="C" />
                                                                <telerik:RadComboBoxItem runat="server" Text="Revise" Value="R" />
                                                            </Items>
                                                        </telerik:RadComboBox>
                                                        &nbsp;<telerik:RadButton ID="RadButton1" runat="server" Skin="Simple" 
                                                            style="font-weight: 700" Text="Submit" Width="150px">
                                                        </telerik:RadButton>
                                                    </td>
                                                    <td align="center" style="height: 32px">
                                                        </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" colspan="2" style="height: 42px">
                                                        &nbsp;<asp:Label ID="lblsubmit" runat="server" Font-Bold="True" 
                                                            Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" colspan="2">
                                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                                            Width="98%">
                                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
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
                                                                        <telerik:GridBoundColumn DataField="Risk_Code" 
                                                                            FilterControlAltText="Filter Risk_Code column" HeaderText="File Risk_Code" 
                                                                            ItemStyle-Width="50" SortExpression="Risk_Code" UniqueName="Risk_Code">
                                                                            <ItemStyle Width="50px" />
                                                                        </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Notes_by" 
                                                                            FilterControlAltText="Filter Notes_by column" HeaderText="From" 
                                                                            ItemStyle-Width="100" SortExpression="Notes_by" UniqueName="Notes_by">
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
                                <tr>
                                    <td>
                                        &nbsp;<asp:HiddenField ID="HiddenField1" runat="server" />
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
     
            </asp:UpdatePanel>
</asp:Content>

